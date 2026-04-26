import "server-only";

import {
  nextFixtureId,
  nowIso,
  type PaymentKind,
  type PaymentRecord,
} from "@/contracts";
import {
  DEALER_SUBSCRIPTION_AMOUNT_USD,
  DEPOSIT_AMOUNT_USD,
  LEAD_UNLOCK_AMOUNT_USD,
  LISTING_FEE_AMOUNT_USD,
} from "@/lib/payments/amounts";
import {
  getMercuryClient,
  type MercuryTransaction,
  type MercuryWebhookEvent,
} from "@/lib/payments/mercury-client";
import * as Storage from "@/services/team-15-storage";
import * as Workflows from "@/services/team-12-workflows";
import * as Notifications from "@/services/team-13-notifications";

// Team 14 — Payments backend (Mercury ACH/wire integration).
//
// Customers send ACH/wire payments to our Mercury account. We:
// 1. Create pending PaymentRecords to track expected payments
// 2. Receive transaction.created webhooks when payments arrive
// 3. Match reference (deal ID) to pending PaymentRecord, update status
// 4. Issue refunds via outbound ACH transfers
// 5. Handle subscriptions with manual renewal (ACH pull requests)
//
// Every PaymentRecord persists through Team 15's storage (secure_records,
// bucket "payments"). Subscriptions are stored in bucket "subscriptions"
// keyed by userId. Webhook idempotency is tracked in "mercury_events".

export const PAYMENTS_BUCKET = "payments";
export const SUBSCRIPTIONS_BUCKET = "subscriptions";
export const MERCURY_EVENTS_BUCKET = "mercury_events";

// -------------------------------------------------------------------------
// PaymentRecord persistence

const savePaymentRecord = async (record: PaymentRecord): Promise<void> => {
  await Storage.putRecord(PAYMENTS_BUCKET, record.id, record);
};

export const getPayment = async (
  id: string,
): Promise<PaymentRecord | null> =>
  Storage.getRecord<PaymentRecord>(PAYMENTS_BUCKET, id);

export const listPaymentsForUser = async (
  userId: string,
): Promise<PaymentRecord[]> => {
  const all = await Storage.listRecords<PaymentRecord>(PAYMENTS_BUCKET);
  return all
    .filter((p) => p.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const listPaymentsForDeal = async (
  dealId: string,
): Promise<PaymentRecord[]> => {
  const all = await Storage.listRecords<PaymentRecord>(PAYMENTS_BUCKET);
  return all
    .filter((p) => p.dealId === dealId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

// -------------------------------------------------------------------------
// Notification fan-out. COMPONENTS.md has Stripe Integration + Failed Payment
// Recovery both edged into Notification Service. We emit per category
// "payment" with a compact payload; errors here are swallowed so a
// notification-service outage never blocks a charge or webhook.

type PaymentNotificationKind = "succeeded" | "failed" | "refund";

const emitPaymentNotification = async (input: {
  userId: string;
  kind: PaymentNotificationKind;
  payment: PaymentRecord;
}): Promise<void> => {
  try {
    await Notifications.emitNotification({
      userId: input.userId,
      category: "payment",
      payload: {
        kind: input.kind,
        paymentId: input.payment.id,
        amount: input.payment.amount,
        paymentKind: input.payment.kind,
        dealId: input.payment.dealId,
      },
    });
  } catch {
    // Notification service is best-effort; payment path must not fail on it.
  }
};

// A deposit succeeding is the one transition that unblocks Team 10's
// post-deposit dashboard. We pull buildRecordId + agreementId out of the
// Stripe PI metadata that createDepositCharge planted, then dispatch to
// Team 12's state machine so a DealRecord is created. Safe to call from
// both the webhook and the synchronous confirm path; returns the new
// DealRecord id (or undefined when the metadata is missing, e.g. a
// non-deposit charge replayed through here).

const onDepositConfirmed = async (input: {
  payment: PaymentRecord;
}): Promise<string | undefined> => {
  const buildRecordId = input.payment.buildRecordId;
  const agreementId = input.payment.agreementId;
  if (!buildRecordId || !agreementId) return undefined;
  const deal = await Workflows.onDepositReceived({
    userId: input.payment.userId,
    buildRecordId,
    agreementId,
    paymentId: input.payment.id,
  });
  return deal.id;
};

// -------------------------------------------------------------------------
// Generic charge — creates a pending PaymentRecord for an expected ACH/wire
// payment. The customer sends payment to our Mercury account, and the webhook
// matches the transaction reference (deal ID) to flip status to "succeeded".

export type ChargeInput = {
  userId: string;
  amount: number; // USD dollars
  kind: PaymentKind;
  dealId?: string;
  metadata?: Record<string, string>;
  description?: string;
};

export type ChargeResult = {
  record: PaymentRecord;
  wireInstructions: {
    routingNumber: string;
    accountNumber: string;
    bankName: string;
    reference: string;
  };
};

export const createCharge = async (input: ChargeInput): Promise<ChargeResult> => {
  const recordId = nextFixtureId("pay");
  const dealId = input.dealId ?? recordId;
  const record: PaymentRecord = {
    id: recordId,
    userId: input.userId,
    kind: input.kind,
    amount: input.amount,
    currency: "USD",
    mercuryRef: "", // Will be set when transaction arrives
    status: "pending",
    createdAt: nowIso(),
    ...(dealId ? { dealId } : {}),
  };
  await savePaymentRecord(record);

  // Return wire instructions so customer can send the payment
  const wire = await getWireInstructions({
    dealId,
  });

  return {
    record,
    wireInstructions: {
      routingNumber: wire.routingNumber,
      accountNumber: wire.accountNumber,
      bankName: wire.bankName,
      reference: wire.reference,
    },
  };
};

// Convenience wrappers for the specific charge kinds the product defines.

export const createDepositCharge = async (input: {
  userId: string;
  buildRecordId: string;
  agreementId: string;
}): Promise<ChargeResult> => {
  const result = await createCharge({
    userId: input.userId,
    amount: DEPOSIT_AMOUNT_USD,
    kind: "deposit",
  });
  // Store build/agreement info in the payment record for later lookup
  const updated = {
    ...result.record,
    buildRecordId: input.buildRecordId,
    agreementId: input.agreementId,
  };
  await savePaymentRecord(updated);
  return {
    ...result,
    record: updated,
  };
};

export const chargeLeadUnlock = (input: {
  dealerId: string;
  leadId: string;
  paymentMethodId?: string;
  stripeCustomerId?: string;
}): Promise<ChargeResult> =>
  createCharge({
    userId: input.dealerId,
    amount: LEAD_UNLOCK_AMOUNT_USD,
    kind: "lead-unlock",
    paymentMethodId: input.paymentMethodId,
    stripeCustomerId: input.stripeCustomerId,
    description: "Dealer lead unlock",
    metadata: { leadId: input.leadId },
  });

export const chargeListingFee = (input: {
  dealerId: string;
  listingId: string;
  paymentMethodId?: string;
  stripeCustomerId?: string;
}): Promise<ChargeResult> =>
  createCharge({
    userId: input.dealerId,
    amount: LISTING_FEE_AMOUNT_USD,
    kind: "listing-fee",
    paymentMethodId: input.paymentMethodId,
    stripeCustomerId: input.stripeCustomerId,
    description: "Extra listing fee",
    metadata: { listingId: input.listingId },
  });

export const chargeBalance = (input: {
  userId: string;
  dealId: string;
  amount: number;
  stripeCustomerId?: string;
  paymentMethodId?: string;
}): Promise<ChargeResult> =>
  createCharge({
    userId: input.userId,
    amount: input.amount,
    kind: "balance",
    dealId: input.dealId,
    stripeCustomerId: input.stripeCustomerId,
    paymentMethodId: input.paymentMethodId,
    description: `Balance payment for deal ${input.dealId}`,
  });

// -------------------------------------------------------------------------
// Refunds — issue ACH transfer back to customer

export const issueRefund = async (input: {
  paymentId: string;
  reason?: string;
  amount?: number; // USD; full refund when omitted
  customerRoutingNumber?: string;
  customerAccountNumber?: string;
}): Promise<PaymentRecord> => {
  const original = await getPayment(input.paymentId);
  if (!original) {
    throw new Error(`[payments] payment ${input.paymentId} not found`);
  }
  if (original.status !== "succeeded") {
    throw new Error(
      `[payments] payment ${input.paymentId} is not refundable in status ${original.status}`,
    );
  }

  const refundedAmount = input.amount ?? original.amount;
  const mercury = getMercuryClient();
  const accountId = process.env.MERCURY_ACCOUNT_ID;
  if (!accountId) {
    throw new Error("[payments] MERCURY_ACCOUNT_ID not configured");
  }

  // Create outbound ACH transfer
  let txn: MercuryTransaction | null = null;
  if (input.customerRoutingNumber && input.customerAccountNumber) {
    txn = await mercury.createAchTransfer({
      accountId,
      amount: Math.round(refundedAmount * 100), // Convert to cents
      counterpartyName: `Refund for payment ${input.paymentId}`,
      counterpartyRoutingNumber: input.customerRoutingNumber,
      counterpartyAccountNumber: input.customerAccountNumber,
      reference: input.paymentId,
      memo: input.reason ?? "Refund",
    });
  }

  const refundRecord: PaymentRecord = {
    id: nextFixtureId("pay"),
    userId: original.userId,
    kind: "refund",
    amount: refundedAmount,
    currency: "USD",
    mercuryRef: txn?.id ?? "",
    status: txn ? "pending" : "pending", // Pending until Mercury webhook confirms
    createdAt: nowIso(),
    ...(original.dealId ? { dealId: original.dealId } : {}),
  };
  await savePaymentRecord(refundRecord);

  // Only flip original to "refunded" on a full refund
  if (refundedAmount >= original.amount) {
    await savePaymentRecord({ ...original, status: "refunded" });
  }

  await emitPaymentNotification({
    userId: original.userId,
    kind: "refund",
    payment: refundRecord,
  });

  return refundRecord;
};

// -------------------------------------------------------------------------
// Failed payment recovery — customer resends via new wire/ACH

export const retryFailedPayment = async (input: {
  paymentId: string;
}): Promise<PaymentRecord> => {
  const original = await getPayment(input.paymentId);
  if (!original) {
    throw new Error(`[payments] payment ${input.paymentId} not found`);
  }
  if (original.status === "succeeded") {
    return original;
  }
  // For Mercury, retry just means customer sends the payment again.
  // We don't initiate anything; update the original to pending so
  // it can be matched again when the next transaction arrives.
  const updated = { ...original, status: "pending" };
  await savePaymentRecord(updated);
  return updated;
};

// -------------------------------------------------------------------------
// Subscriptions — state stored via Storage.putRecord("subscriptions", userId).
//
// COMPONENTS.md §Team 14 specifies a single $99/mo dealer subscription. The
// plan type stays a string union so future tiers can be added without
// churning call sites, but today it has exactly one member.

export type SubscriptionPlan = "dealer-basic";

export type Subscription = {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: "active" | "past_due" | "cancelled";
  currentPeriodEnd: string; // ISO timestamp when renewal should happen
  cancelledAt?: string; // ISO timestamp when cancelled
  amountUsd: number;
  createdAt: string;
  updatedAt: string;
};

const AMOUNT_BY_PLAN: Record<SubscriptionPlan, number> = {
  "dealer-basic": DEALER_SUBSCRIPTION_AMOUNT_USD,
};

export const getSubscription = async (
  userId: string,
): Promise<Subscription | null> =>
  Storage.getRecord<Subscription>(SUBSCRIPTIONS_BUCKET, userId);

export const startSubscription = async (input: {
  userId: string;
  plan: SubscriptionPlan;
}): Promise<Subscription> => {
  const now = new Date();
  const nextPeriod = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const record: Subscription = {
    id: nextFixtureId("sub"),
    userId: input.userId,
    plan: input.plan,
    status: "active",
    currentPeriodEnd: nextPeriod.toISOString(),
    amountUsd: AMOUNT_BY_PLAN[input.plan],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await Storage.putRecord(SUBSCRIPTIONS_BUCKET, input.userId, record);
  return record;
};

export const cancelSubscription = async (input: {
  userId: string;
  atPeriodEnd?: boolean;
}): Promise<Subscription> => {
  const existing = await getSubscription(input.userId);
  if (!existing) {
    throw new Error(
      `[payments] no subscription found for user ${input.userId}`,
    );
  }
  const updated: Subscription = {
    ...existing,
    status: "cancelled",
    cancelledAt: nowIso(),
    updatedAt: nowIso(),
  };
  await Storage.putRecord(SUBSCRIPTIONS_BUCKET, input.userId, updated);
  return updated;
};

export const processSubscriptionRenewals = async (): Promise<{
  processed: number;
  failed: number;
}> => {
  const allSubs = await Storage.listRecords<Subscription>(SUBSCRIPTIONS_BUCKET);
  const now = new Date();
  let processed = 0;
  let failed = 0;

  for (const sub of allSubs) {
    if (sub.status !== "active") continue;
    const periodEnd = new Date(sub.currentPeriodEnd);
    if (now < periodEnd) continue; // Not ready for renewal yet

    try {
      const charge = await createCharge({
        userId: sub.userId,
        amount: sub.amountUsd,
        kind: "subscription",
      });
      // Update period end for next month
      const nextPeriod = new Date(periodEnd);
      nextPeriod.setMonth(nextPeriod.getMonth() + 1);
      await Storage.putRecord(SUBSCRIPTIONS_BUCKET, sub.userId, {
        ...sub,
        currentPeriodEnd: nextPeriod.toISOString(),
        updatedAt: nowIso(),
      });
      processed++;
    } catch (err) {
      console.error(`[payments] renewal failed for user ${sub.userId}:`, err);
      // Mark subscription as past_due
      await Storage.putRecord(SUBSCRIPTIONS_BUCKET, sub.userId, {
        ...sub,
        status: "past_due",
        updatedAt: nowIso(),
      });
      failed++;
    }
  }

  return { processed, failed };
};

// -------------------------------------------------------------------------
// Wire instructions — generated from DealRecord.id. We don't persist per-deal
// wire numbers; they're derived deterministically from our escrow account +
// the deal id acting as the reference so ACH reconciliation lines up.

export type WireInstructions = {
  routingNumber: string;
  accountNumber: string;
  beneficiary: string;
  reference: string;
  bankName: string;
};

export const getWireInstructions = async (input: {
  dealId: string;
}): Promise<WireInstructions> => ({
  routingNumber: process.env.PICKNBUILD_WIRE_ROUTING ?? "123456789",
  accountNumber: process.env.PICKNBUILD_WIRE_ACCOUNT ?? "000111222",
  beneficiary: "PicknBuild Escrow LLC",
  bankName: process.env.PICKNBUILD_WIRE_BANK ?? "First National",
  reference: input.dealId,
});

// -------------------------------------------------------------------------
// Webhook handling (Mercury). Idempotent — every Mercury event id is recorded once.
//
// Supported events:
//   transaction.created -> incoming ACH/wire payment
//   transaction.updated -> status change (pending -> posted -> failed)

type WebhookResult = {
  handled: boolean;
  reason?: string;
  payment?: PaymentRecord;
  dealId?: string;
};

const findPendingPaymentByReference = async (
  reference: string,
): Promise<PaymentRecord | null> => {
  const all = await Storage.listRecords<PaymentRecord>(PAYMENTS_BUCKET);
  return (
    all.find((p) => p.dealId === reference && p.status === "pending") ?? null
  );
};

export const handleWebhookEvent = async (
  event: MercuryWebhookEvent,
): Promise<WebhookResult> => {
  // Check idempotency
  const already = await Storage.getRecord<MercuryWebhookEvent>(
    MERCURY_EVENTS_BUCKET,
    event.id,
  );
  if (already) return { handled: false, reason: "duplicate" };
  await Storage.putRecord(MERCURY_EVENTS_BUCKET, event.id, event);

  switch (event.type) {
    case "transaction.created":
    case "transaction.updated": {
      const txn = event.data.transaction;
      if (!txn) return { handled: false, reason: "no-transaction-data" };

      // Only process incoming, posted transactions
      if (txn.direction !== "in" || txn.status !== "posted") {
        return { handled: false, reason: "not-posted-inbound-transaction" };
      }

      // Match to pending payment by reference (deal ID)
      const record = await findPendingPaymentByReference(txn.reference);
      if (!record) {
        return { handled: false, reason: "no-matching-payment" };
      }

      // Update payment record with transaction ref and mark succeeded
      let updated: PaymentRecord = {
        ...record,
        mercuryRef: txn.id,
        status: "succeeded",
      };
      await savePaymentRecord(updated);

      // If this is a deposit, trigger Team 12 workflow
      let dealId: string | undefined;
      if (updated.kind === "deposit") {
        dealId = await onDepositConfirmed({
          payment: updated,
        });
      }

      await emitPaymentNotification({
        userId: updated.userId,
        kind: "succeeded",
        payment: updated,
      });

      return {
        handled: true,
        payment: updated,
        ...(dealId ? { dealId } : {}),
      };
    }
    default:
      return { handled: false, reason: "unhandled-event-type" };
  }
};

// -------------------------------------------------------------------------
// Re-exports so downstream code needs only one import for types.

export type { PaymentKind, PaymentRecord } from "@/contracts";
