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

  const record: PaymentRecord = {
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

  const refundRecord: PaymentRecord = {
    id: nextFixtureId("pay"),
    userId: original.userId,
    kind: "refund",
    amount: input.amount ?? original.amount,
    currency: "USD",
    stripeRef: refund.id,
    status: refund.status === "succeeded" ? "refunded" : "pending",
    createdAt: nowIso(),
    ...(original.dealId ? { dealId: original.dealId } : {}),
  };
  await savePaymentRecord(refundRecord);

  // Flip the original record's status so the ledger reflects it.
  if (refund.status === "succeeded") {
    await savePaymentRecord({ ...original, status: "refunded" });
  }

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

export type SubscriptionPlan = "dealer-basic" | "dealer-pro";

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
  "dealer-pro":
    process.env.STRIPE_PRICE_DEALER_PRO ?? "price_dealer_pro_stub",
};

const AMOUNT_BY_PLAN: Record<SubscriptionPlan, number> = {
  "dealer-basic": DEALER_SUBSCRIPTION_AMOUNT_USD,
  "dealer-pro": DEALER_SUBSCRIPTION_AMOUNT_USD * 2,
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
      const updated: PaymentRecord = {
        ...record,
        status: "succeeded",
        amount: fromStripeAmountCents(pi.amount),
      };
      await savePaymentRecord(updated);
      return { handled: true, payment: updated };
    }
    case "payment_intent.payment_failed": {
      const pi = event.data.object as StripePaymentIntent;
      const record = await findPaymentByStripeRef(pi.id);
      if (!record) return { handled: false, reason: "no-matching-payment" };
      const updated: PaymentRecord = { ...record, status: "failed" };
      await savePaymentRecord(updated);
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
