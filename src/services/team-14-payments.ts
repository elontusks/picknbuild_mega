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
  fromStripeAmountCents,
  toStripeAmountCents,
} from "@/lib/payments/amounts";
import {
  getStripeClient,
  type StripePaymentIntent,
  type StripeSubscription,
  type StripeWebhookEvent,
} from "@/lib/payments/stripe-client";
import * as Storage from "@/services/team-15-storage";
import * as Workflows from "@/services/team-12-workflows";
import * as Notifications from "@/services/team-13-notifications";

// Team 14 — Payments backend.
//
// Every mutation persists a PaymentRecord through Team 15's generic storage
// layer (secure_records, bucket "payments"). Subscription state lives in the
// bucket "subscriptions" keyed by userId. Webhook idempotency is tracked in
// "stripe_events" keyed by Stripe event id.
//
// Stripe calls go through src/lib/payments/stripe-client.ts, which tests can
// swap via setStripeClient().

// -------------------------------------------------------------------------
// Storage bucket constants — keep in one place so reads and writes never
// drift and admin ledger views can query the same bucket name.

export const PAYMENTS_BUCKET = "payments";
export const SUBSCRIPTIONS_BUCKET = "subscriptions";
export const STRIPE_EVENTS_BUCKET = "stripe_events";

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
  piMetadata: Record<string, string>;
}): Promise<string | undefined> => {
  const buildRecordId = input.piMetadata.buildRecordId;
  const agreementId = input.piMetadata.agreementId;
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
// Generic charge — creates a Stripe PaymentIntent and a matching pending
// PaymentRecord. The caller (or the webhook) later flips the record's status
// to "succeeded" / "failed" once Stripe confirms.

export type ChargeInput = {
  userId: string;
  amount: number; // USD dollars
  kind: PaymentKind;
  dealId?: string;
  stripeCustomerId?: string;
  paymentMethodId?: string;
  confirmNow?: boolean;
  metadata?: Record<string, string>;
  description?: string;
};

export type ChargeResult = {
  record: PaymentRecord;
  clientSecret: string | null;
  paymentIntentId: string;
};

const statusFromStripe = (
  intent: StripePaymentIntent,
): PaymentRecord["status"] => {
  switch (intent.status) {
    case "succeeded":
      return "succeeded";
    case "canceled":
      return "failed";
    default:
      return "pending";
  }
};

export const createCharge = async (input: ChargeInput): Promise<ChargeResult> => {
  const stripe = getStripeClient();
  const intent = await stripe.createPaymentIntent({
    amount: toStripeAmountCents(input.amount),
    currency: "usd",
    description: input.description,
    customer: input.stripeCustomerId,
    paymentMethod: input.paymentMethodId,
    confirm: input.confirmNow ?? Boolean(input.paymentMethodId),
    metadata: {
      ...(input.metadata ?? {}),
      userId: input.userId,
      kind: input.kind,
      ...(input.dealId ? { dealId: input.dealId } : {}),
    },
  });

  let record: PaymentRecord = {
    id: nextFixtureId("pay"),
    userId: input.userId,
    kind: input.kind,
    amount: input.amount,
    currency: "USD",
    stripeRef: intent.id,
    status: statusFromStripe(intent),
    createdAt: nowIso(),
    ...(input.dealId ? { dealId: input.dealId } : {}),
  };
  await savePaymentRecord(record);

  // Synchronous confirm path (card-on-file): mirror the side effects the
  // webhook fires on payment_intent.succeeded so both entry points behave
  // identically downstream.
  if (record.status === "succeeded") {
    if (record.kind === "deposit") {
      const dealId = await onDepositConfirmed({
        payment: record,
        piMetadata: intent.metadata ?? {},
      });
      if (dealId) {
        record = { ...record, dealId };
        await savePaymentRecord(record);
      }
    }
    await emitPaymentNotification({
      userId: record.userId,
      kind: "succeeded",
      payment: record,
    });
  }

  return {
    record,
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
  };
};

// Convenience wrappers for the specific charge kinds the product defines.

export const createDepositCharge = (input: {
  userId: string;
  buildRecordId: string;
  agreementId: string;
  paymentMethodId?: string;
  stripeCustomerId?: string;
}): Promise<ChargeResult> =>
  createCharge({
    userId: input.userId,
    amount: DEPOSIT_AMOUNT_USD,
    kind: "deposit",
    paymentMethodId: input.paymentMethodId,
    stripeCustomerId: input.stripeCustomerId,
    confirmNow: Boolean(input.paymentMethodId),
    description: "PicknBuild deposit",
    metadata: {
      buildRecordId: input.buildRecordId,
      agreementId: input.agreementId,
    },
  });

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
// Refunds

export const issueRefund = async (input: {
  paymentId: string;
  reason?: string;
  amount?: number; // USD; full refund when omitted
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
  const stripe = getStripeClient();
  const refund = await stripe.createRefund({
    paymentIntentId: original.stripeRef,
    amount:
      input.amount !== undefined ? toStripeAmountCents(input.amount) : undefined,
    reason: input.reason,
  });

  const refundedAmount = input.amount ?? original.amount;
  const refundRecord: PaymentRecord = {
    id: nextFixtureId("pay"),
    userId: original.userId,
    kind: "refund",
    amount: refundedAmount,
    currency: "USD",
    stripeRef: refund.id,
    status: refund.status === "succeeded" ? "refunded" : "pending",
    createdAt: nowIso(),
    ...(original.dealId ? { dealId: original.dealId } : {}),
  };
  await savePaymentRecord(refundRecord);

  // Only flip the original to "refunded" on a full refund. A partial refund
  // leaves the original "succeeded" so the ledger reads
  // "succeeded, partial refund issued" instead of "refunded while most of
  // the money is still held" — which would surprise Team 15's activity log.
  if (refund.status === "succeeded" && refundedAmount >= original.amount) {
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
// Failed payment recovery

export const retryFailedPayment = async (input: {
  paymentId: string;
  paymentMethodId: string;
}): Promise<PaymentRecord> => {
  const original = await getPayment(input.paymentId);
  if (!original) {
    throw new Error(`[payments] payment ${input.paymentId} not found`);
  }
  if (original.status === "succeeded") {
    return original;
  }
  const retried = await createCharge({
    userId: original.userId,
    amount: original.amount,
    kind: original.kind,
    dealId: original.dealId,
    paymentMethodId: input.paymentMethodId,
    confirmNow: true,
    description: `Retry of ${input.paymentId}`,
    metadata: { retryOf: input.paymentId },
  });
  return retried.record;
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
  status: "active" | "past_due" | "cancelled" | "incomplete";
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  currentPeriodEnd: string; // ISO timestamp
  cancelAtPeriodEnd: boolean;
  amountUsd: number;
  createdAt: string;
  updatedAt: string;
};

const PRICE_ID_BY_PLAN: Record<SubscriptionPlan, string> = {
  "dealer-basic":
    process.env.STRIPE_PRICE_DEALER_BASIC ?? "price_dealer_basic_stub",
};

const AMOUNT_BY_PLAN: Record<SubscriptionPlan, number> = {
  "dealer-basic": DEALER_SUBSCRIPTION_AMOUNT_USD,
};

const subscriptionStatusFromStripe = (
  s: StripeSubscription["status"],
): Subscription["status"] => {
  switch (s) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
      return "cancelled";
    default:
      return "incomplete";
  }
};

const hydrate = (
  stripeSub: StripeSubscription,
  existing: Subscription | null,
  overrides: Partial<Subscription>,
): Subscription => {
  const plan = overrides.plan ?? existing?.plan ?? "dealer-basic";
  return {
    id: existing?.id ?? nextFixtureId("sub"),
    userId: overrides.userId ?? existing?.userId ?? "",
    plan,
    status: subscriptionStatusFromStripe(stripeSub.status),
    stripeSubscriptionId: stripeSub.id,
    stripeCustomerId: stripeSub.customer,
    currentPeriodEnd: new Date(stripeSub.current_period_end * 1000).toISOString(),
    cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    amountUsd: AMOUNT_BY_PLAN[plan],
    createdAt: existing?.createdAt ?? nowIso(),
    updatedAt: nowIso(),
  };
};

export const getSubscription = async (
  userId: string,
): Promise<Subscription | null> =>
  Storage.getRecord<Subscription>(SUBSCRIPTIONS_BUCKET, userId);

export const startSubscription = async (input: {
  userId: string;
  plan: SubscriptionPlan;
  email?: string;
  stripeCustomerId?: string;
}): Promise<Subscription> => {
  const stripe = getStripeClient();
  const customerId =
    input.stripeCustomerId ??
    (await stripe.createCustomer({
      email: input.email,
      metadata: { userId: input.userId },
    })).id;
  const stripeSub = await stripe.createSubscription({
    customer: customerId,
    priceId: PRICE_ID_BY_PLAN[input.plan],
    metadata: { userId: input.userId, plan: input.plan },
  });
  const record = hydrate(stripeSub, null, {
    userId: input.userId,
    plan: input.plan,
  });
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
  const stripe = getStripeClient();
  const stripeSub = await stripe.cancelSubscription(
    existing.stripeSubscriptionId,
    { atPeriodEnd: input.atPeriodEnd ?? true },
  );
  const updated = hydrate(stripeSub, existing, {});
  await Storage.putRecord(SUBSCRIPTIONS_BUCKET, input.userId, updated);
  return updated;
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
// Webhook handling. Idempotent — every Stripe event id is recorded once.
//
// Supported events:
//   payment_intent.succeeded       -> flip PaymentRecord to succeeded
//   payment_intent.payment_failed  -> flip PaymentRecord to failed
//   charge.refunded                -> handled by issueRefund path (noop here)
//   customer.subscription.updated  -> hydrate subscription state
//   customer.subscription.deleted  -> mark subscription cancelled

type WebhookResult = {
  handled: boolean;
  reason?: string;
  payment?: PaymentRecord;
  subscription?: Subscription;
  dealId?: string;
};

const findPaymentByStripeRef = async (
  stripeRef: string,
): Promise<PaymentRecord | null> => {
  const all = await Storage.listRecords<PaymentRecord>(PAYMENTS_BUCKET);
  return all.find((p) => p.stripeRef === stripeRef) ?? null;
};

export const handleWebhookEvent = async (
  event: StripeWebhookEvent,
): Promise<WebhookResult> => {
  const already = await Storage.getRecord<StripeWebhookEvent>(
    STRIPE_EVENTS_BUCKET,
    event.id,
  );
  if (already) return { handled: false, reason: "duplicate" };
  await Storage.putRecord(STRIPE_EVENTS_BUCKET, event.id, event);

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object as StripePaymentIntent;
      const record = await findPaymentByStripeRef(pi.id);
      if (!record) return { handled: false, reason: "no-matching-payment" };
      let updated: PaymentRecord = {
        ...record,
        status: "succeeded",
        amount: fromStripeAmountCents(pi.amount),
      };
      await savePaymentRecord(updated);

      let dealId: string | undefined;
      if (updated.kind === "deposit") {
        // Dispatch to Team 12's state machine so a DealRecord is created
        // and Team 10's post-deposit dashboard has something to render.
        dealId = await onDepositConfirmed({
          payment: updated,
          piMetadata: pi.metadata ?? {},
        });
        if (dealId) {
          updated = { ...updated, dealId };
          await savePaymentRecord(updated);
        }
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
    case "payment_intent.payment_failed": {
      const pi = event.data.object as StripePaymentIntent;
      const record = await findPaymentByStripeRef(pi.id);
      if (!record) return { handled: false, reason: "no-matching-payment" };
      const updated: PaymentRecord = { ...record, status: "failed" };
      await savePaymentRecord(updated);
      await emitPaymentNotification({
        userId: updated.userId,
        kind: "failed",
        payment: updated,
      });
      return { handled: true, payment: updated };
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as StripeSubscription;
      const userId = sub.metadata?.userId;
      if (!userId) return { handled: false, reason: "missing-user-metadata" };
      const existing = await getSubscription(userId);
      const updated = hydrate(sub, existing, { userId });
      await Storage.putRecord(SUBSCRIPTIONS_BUCKET, userId, updated);
      return { handled: true, subscription: updated };
    }
    default:
      return { handled: false, reason: "unhandled-event-type" };
  }
};

// -------------------------------------------------------------------------
// Re-exports so downstream code needs only one import for types.

export type { PaymentKind, PaymentRecord } from "@/contracts";
