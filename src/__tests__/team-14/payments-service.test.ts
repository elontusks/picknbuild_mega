import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

// Storage is mocked with an in-memory map so we can read what the service
// writes without hitting Supabase.

type Bucket = Map<string, unknown>;
const buckets = new Map<string, Bucket>();
const getBucket = (name: string): Bucket => {
  if (!buckets.has(name)) buckets.set(name, new Map());
  return buckets.get(name)!;
};

vi.mock("@/services/team-15-storage", () => ({
  putRecord: vi.fn(async (bucket: string, id: string, value: unknown) => {
    getBucket(bucket).set(id, value);
  }),
  getRecord: vi.fn(async (bucket: string, id: string) =>
    getBucket(bucket).get(id) ?? null,
  ),
  listRecords: vi.fn(async (bucket: string) =>
    Array.from(getBucket(bucket).values()),
  ),
  removeRecord: vi.fn(async (bucket: string, id: string) => {
    getBucket(bucket).delete(id);
  }),
}));

// Team 12 dispatch + Team 13 notifications are observed via spies. The real
// fixture services aren't wrong to run, but we want assertions on the
// edges that Architecture §5 specifies.
const onDepositReceivedMock = vi.fn(
  async (input: {
    userId: string;
    buildRecordId: string;
    agreementId: string;
    paymentId: string;
  }) => ({
    id: `deal_${input.paymentId}`,
    userId: input.userId,
    buildRecordId: input.buildRecordId,
    listingId: undefined,
    committedSpec: {
      makeModelYearRange: "",
      mileageRange: "",
      titleType: "clean" as const,
      customizations: [],
      attachments: [],
    },
    package: "standard" as const,
    pricing: { total: 0, down: 0, biweekly: 0, term: "3y" as const },
    status: "build-started" as const,
    timeline: [],
    agreementId: input.agreementId,
    createdAt: new Date().toISOString(),
  }),
);
vi.mock("@/services/team-12-workflows", () => ({
  onDepositReceived: (
    ...args: Parameters<typeof onDepositReceivedMock>
  ) => onDepositReceivedMock(...args),
}));

const emitNotificationMock = vi.fn(async () => []);
vi.mock("@/services/team-13-notifications", () => ({
  emitNotification: (...args: unknown[]) => emitNotificationMock(...(args as [])),
}));

import {
  cancelSubscription,
  chargeBalance,
  chargeLeadUnlock,
  chargeListingFee,
  createCharge,
  createDepositCharge,
  getPayment,
  getSubscription,
  handleWebhookEvent,
  issueRefund,
  listPaymentsForDeal,
  listPaymentsForUser,
  PAYMENTS_BUCKET,
  retryFailedPayment,
  startSubscription,
  STRIPE_EVENTS_BUCKET,
  SUBSCRIPTIONS_BUCKET,
} from "@/services/team-14-payments";
import type { PaymentRecord } from "@/contracts";
import {
  setStripeClient,
  type StripeClient,
  type StripePaymentIntent,
  type StripeSubscription,
} from "@/lib/payments/stripe-client";

const makeMockStripe = (): StripeClient & {
  intents: Map<string, StripePaymentIntent>;
  subscriptions: Map<string, StripeSubscription>;
} => {
  let piCounter = 0;
  let reCounter = 0;
  let cusCounter = 0;
  let subCounter = 0;
  const intents = new Map<string, StripePaymentIntent>();
  const subscriptions = new Map<string, StripeSubscription>();

  const client: StripeClient = {
    createPaymentIntent: async (input) => {
      piCounter += 1;
      const pi: StripePaymentIntent = {
        id: `pi_test_${piCounter}`,
        object: "payment_intent",
        amount: input.amount,
        currency: input.currency,
        status: input.confirm ? "succeeded" : "requires_confirmation",
        client_secret: `pi_test_${piCounter}_secret`,
        customer: input.customer ?? null,
        metadata: input.metadata ?? {},
      };
      intents.set(pi.id, pi);
      return pi;
    },
    retrievePaymentIntent: async (id) => {
      const pi = intents.get(id);
      if (!pi) throw new Error("not found");
      return pi;
    },
    createRefund: async (input) => {
      reCounter += 1;
      return {
        id: `re_test_${reCounter}`,
        object: "refund",
        payment_intent: input.paymentIntentId,
        amount: input.amount ?? 0,
        currency: "usd",
        status: "succeeded",
        reason: input.reason ?? null,
      };
    },
    createCustomer: async (input) => {
      cusCounter += 1;
      return {
        id: `cus_test_${cusCounter}`,
        object: "customer",
        email: input.email ?? null,
        metadata: input.metadata ?? {},
      };
    },
    createSubscription: async (input) => {
      subCounter += 1;
      const sub: StripeSubscription = {
        id: `sub_test_${subCounter}`,
        object: "subscription",
        customer: input.customer,
        status: "active",
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
        cancel_at_period_end: false,
        items: { data: [{ price: { id: input.priceId } }] },
        metadata: input.metadata ?? {},
      };
      subscriptions.set(sub.id, sub);
      return sub;
    },
    cancelSubscription: async (id, opts) => {
      const existing = subscriptions.get(id);
      if (!existing) throw new Error("not found");
      const updated: StripeSubscription = {
        ...existing,
        status: opts?.atPeriodEnd ? "active" : "canceled",
        cancel_at_period_end: Boolean(opts?.atPeriodEnd),
      };
      subscriptions.set(id, updated);
      return updated;
    },
    retrieveSubscription: async (id) => {
      const s = subscriptions.get(id);
      if (!s) throw new Error("not found");
      return s;
    },
    verifyWebhook: () => {
      throw new Error("not used in these tests");
    },
  };
  return Object.assign(client, { intents, subscriptions });
};

let stripe: ReturnType<typeof makeMockStripe>;

beforeEach(() => {
  buckets.clear();
  onDepositReceivedMock.mockClear();
  emitNotificationMock.mockClear();
  stripe = makeMockStripe();
  setStripeClient(stripe);
});

afterEach(() => {
  setStripeClient(null);
});

describe("createCharge", () => {
  test("creates a Stripe PaymentIntent and persists a pending PaymentRecord", async () => {
    const result = await createCharge({
      userId: "u1",
      amount: 1000,
      kind: "deposit",
      description: "deposit",
    });

    expect(result.paymentIntentId).toBe("pi_test_1");
    expect(result.clientSecret).toBe("pi_test_1_secret");
    expect(result.record.status).toBe("pending");
    expect(result.record.amount).toBe(1000);
    expect(result.record.stripeRef).toBe("pi_test_1");

    const stored = await getPayment(result.record.id);
    expect(stored).toEqual(result.record);
  });

  test("marks the record succeeded when Stripe confirms synchronously", async () => {
    const result = await createCharge({
      userId: "u1",
      amount: 50,
      kind: "balance",
      confirmNow: true,
      dealId: "deal_1",
    });
    expect(result.record.status).toBe("succeeded");
    expect(result.record.dealId).toBe("deal_1");
  });

  test("sends userId, kind, and dealId in Stripe metadata", async () => {
    const spy = vi.spyOn(stripe, "createPaymentIntent");
    await createCharge({
      userId: "u9",
      amount: 15,
      kind: "lead-unlock",
      dealId: "deal_9",
      metadata: { leadId: "lead_9" },
    });
    const [input] = spy.mock.calls[0] as [Parameters<StripeClient["createPaymentIntent"]>[0]];
    expect(input.metadata).toMatchObject({
      userId: "u9",
      kind: "lead-unlock",
      dealId: "deal_9",
      leadId: "lead_9",
    });
  });
});

describe("createDepositCharge", () => {
  test("charges $1,000 with the deposit kind and build/agreement metadata", async () => {
    const spy = vi.spyOn(stripe, "createPaymentIntent");
    const result = await createDepositCharge({
      userId: "u1",
      buildRecordId: "bld_1",
      agreementId: "agr_1",
    });
    expect(result.record.amount).toBe(1000);
    expect(result.record.kind).toBe("deposit");
    const [input] = spy.mock.calls[0] as [Parameters<StripeClient["createPaymentIntent"]>[0]];
    expect(input.amount).toBe(100000); // cents
    expect(input.metadata).toMatchObject({
      buildRecordId: "bld_1",
      agreementId: "agr_1",
      kind: "deposit",
    });
  });
});

describe("per-kind helpers", () => {
  test("chargeLeadUnlock uses the dealer id as userId and $15", async () => {
    const { record } = await chargeLeadUnlock({
      dealerId: "dealer_1",
      leadId: "lead_1",
    });
    expect(record.userId).toBe("dealer_1");
    expect(record.amount).toBe(15);
    expect(record.kind).toBe("lead-unlock");
  });

  test("chargeListingFee charges $5 listing-fee", async () => {
    const { record } = await chargeListingFee({
      dealerId: "dealer_1",
      listingId: "lst_1",
    });
    expect(record.amount).toBe(5);
    expect(record.kind).toBe("listing-fee");
  });

  test("chargeBalance uses caller amount and attaches dealId", async () => {
    const { record } = await chargeBalance({
      userId: "u1",
      dealId: "deal_1",
      amount: 5000,
    });
    expect(record.amount).toBe(5000);
    expect(record.kind).toBe("balance");
    expect(record.dealId).toBe("deal_1");
  });
});

describe("issueRefund", () => {
  test("refunds a succeeded deposit and flips the original to refunded", async () => {
    const { record: deposit } = await createCharge({
      userId: "u1",
      amount: 1000,
      kind: "deposit",
      confirmNow: true,
    });
    const refund = await issueRefund({
      paymentId: deposit.id,
      reason: "user_requested",
    });
    expect(refund.kind).toBe("refund");
    expect(refund.status).toBe("refunded");
    expect(refund.amount).toBe(1000);

    const original = await getPayment(deposit.id);
    expect(original?.status).toBe("refunded");
  });

  test("partial refund honors the amount and leaves the original succeeded", async () => {
    const { record } = await createCharge({
      userId: "u1",
      amount: 1000,
      kind: "deposit",
      confirmNow: true,
    });
    const refund = await issueRefund({ paymentId: record.id, amount: 250 });
    expect(refund.amount).toBe(250);
    expect(refund.status).toBe("refunded");
    // Original stays "succeeded" — the remaining $750 is still held, so the
    // ledger shouldn't read "refunded" on the original row.
    const original = await getPayment(record.id);
    expect(original?.status).toBe("succeeded");
  });

  test("refund emits a payment-category notification", async () => {
    const { record } = await createCharge({
      userId: "u1",
      amount: 1000,
      kind: "deposit",
      confirmNow: true,
    });
    emitNotificationMock.mockClear();
    await issueRefund({ paymentId: record.id });
    const call = emitNotificationMock.mock.calls[0] as unknown as [
      {
        userId: string;
        category: string;
        payload: { kind: string };
      },
    ];
    expect(call[0].userId).toBe("u1");
    expect(call[0].category).toBe("payment");
    expect(call[0].payload.kind).toBe("refund");
  });

  test("throws when the payment is not found", async () => {
    await expect(issueRefund({ paymentId: "pay_missing" })).rejects.toThrow(
      /not found/,
    );
  });

  test("throws when the payment is not in a refundable status", async () => {
    const { record } = await createCharge({
      userId: "u1",
      amount: 1000,
      kind: "deposit",
      // leaves it pending
    });
    await expect(issueRefund({ paymentId: record.id })).rejects.toThrow(
      /not refundable/,
    );
  });
});

describe("retryFailedPayment", () => {
  test("creates a new succeeded charge of the same amount + kind", async () => {
    const failed: PaymentRecord = {
      id: "pay_failed",
      userId: "u1",
      kind: "deposit",
      amount: 1000,
      currency: "USD",
      stripeRef: "pi_old",
      status: "failed",
      createdAt: new Date().toISOString(),
    };
    getBucket(PAYMENTS_BUCKET).set(failed.id, failed);
    const retried = await retryFailedPayment({
      paymentId: failed.id,
      paymentMethodId: "pm_card_visa",
    });
    expect(retried.status).toBe("succeeded");
    expect(retried.amount).toBe(1000);
    expect(retried.kind).toBe("deposit");
  });

  test("returns the original if it is already succeeded", async () => {
    const { record } = await createCharge({
      userId: "u1",
      amount: 1000,
      kind: "deposit",
      confirmNow: true,
    });
    const out = await retryFailedPayment({
      paymentId: record.id,
      paymentMethodId: "pm_card_visa",
    });
    expect(out.id).toBe(record.id);
  });
});

describe("list payments", () => {
  test("listPaymentsForUser returns records for the user, newest first", async () => {
    const { record: a } = await createCharge({
      userId: "u1",
      amount: 1000,
      kind: "deposit",
    });
    await new Promise((r) => setTimeout(r, 5));
    const { record: b } = await createCharge({
      userId: "u1",
      amount: 50,
      kind: "balance",
      dealId: "deal_1",
    });
    await createCharge({ userId: "u2", amount: 15, kind: "lead-unlock" });

    const out = await listPaymentsForUser("u1");
    expect(out.map((p) => p.id)).toEqual([b.id, a.id]);
  });

  test("listPaymentsForDeal filters to the deal id", async () => {
    const { record } = await createCharge({
      userId: "u1",
      amount: 50,
      kind: "balance",
      dealId: "deal_1",
    });
    await createCharge({ userId: "u1", amount: 1000, kind: "deposit" });
    const out = await listPaymentsForDeal("deal_1");
    expect(out.map((p) => p.id)).toEqual([record.id]);
  });
});

describe("subscriptions", () => {
  test("startSubscription creates a customer when none is supplied and persists state", async () => {
    const cusSpy = vi.spyOn(stripe, "createCustomer");
    const sub = await startSubscription({
      userId: "u1",
      plan: "dealer-basic",
      email: "dealer@test.com",
    });
    expect(cusSpy).toHaveBeenCalledWith({
      email: "dealer@test.com",
      metadata: { userId: "u1" },
    });
    expect(sub.status).toBe("active");
    expect(sub.plan).toBe("dealer-basic");
    expect(sub.amountUsd).toBe(99);

    const stored = await getSubscription("u1");
    expect(stored?.stripeSubscriptionId).toBe(sub.stripeSubscriptionId);
  });

  test("startSubscription reuses the supplied customer id", async () => {
    const cusSpy = vi.spyOn(stripe, "createCustomer");
    await startSubscription({
      userId: "u2",
      plan: "dealer-basic",
      stripeCustomerId: "cus_existing",
    });
    expect(cusSpy).not.toHaveBeenCalled();
    const stored = await getSubscription("u2");
    expect(stored?.stripeCustomerId).toBe("cus_existing");
    expect(stored?.plan).toBe("dealer-basic");
    expect(stored?.amountUsd).toBe(99);
  });

  test("cancelSubscription defaults to cancel_at_period_end=true and keeps status active", async () => {
    await startSubscription({ userId: "u3", plan: "dealer-basic" });
    const updated = await cancelSubscription({ userId: "u3" });
    expect(updated.cancelAtPeriodEnd).toBe(true);
    expect(updated.status).toBe("active");
  });

  test("cancelSubscription immediate flips status to cancelled", async () => {
    await startSubscription({ userId: "u4", plan: "dealer-basic" });
    const updated = await cancelSubscription({
      userId: "u4",
      atPeriodEnd: false,
    });
    expect(updated.status).toBe("cancelled");
  });

  test("cancelSubscription throws when the user has no subscription", async () => {
    await expect(cancelSubscription({ userId: "ghost" })).rejects.toThrow(
      /no subscription/,
    );
  });
});

describe("handleWebhookEvent", () => {
  test("payment_intent.succeeded flips the matching PaymentRecord to succeeded", async () => {
    const { record } = await createCharge({
      userId: "u1",
      amount: 1000,
      kind: "deposit",
    });
    const result = await handleWebhookEvent({
      id: "evt_1",
      type: "payment_intent.succeeded",
      created: 0,
      data: {
        object: {
          id: record.stripeRef,
          amount: 100000,
        } as unknown as Record<string, unknown>,
      },
    });
    expect(result.handled).toBe(true);
    const after = await getPayment(record.id);
    expect(after?.status).toBe("succeeded");
  });

  test("payment_intent.payment_failed flips the record to failed", async () => {
    const { record } = await createCharge({
      userId: "u1",
      amount: 1000,
      kind: "deposit",
    });
    await handleWebhookEvent({
      id: "evt_fail",
      type: "payment_intent.payment_failed",
      created: 0,
      data: { object: { id: record.stripeRef } as Record<string, unknown> },
    });
    const after = await getPayment(record.id);
    expect(after?.status).toBe("failed");
  });

  test("duplicate events are ignored (idempotent)", async () => {
    const { record } = await createCharge({
      userId: "u1",
      amount: 1000,
      kind: "deposit",
    });
    await handleWebhookEvent({
      id: "evt_dup",
      type: "payment_intent.succeeded",
      created: 0,
      data: { object: { id: record.stripeRef, amount: 100000 } as Record<string, unknown> },
    });
    const second = await handleWebhookEvent({
      id: "evt_dup",
      type: "payment_intent.succeeded",
      created: 0,
      data: { object: { id: record.stripeRef, amount: 100000 } as Record<string, unknown> },
    });
    expect(second.handled).toBe(false);
    expect(second.reason).toBe("duplicate");
    // And the event should be logged in the events bucket.
    expect(getBucket(STRIPE_EVENTS_BUCKET).size).toBe(1);
  });

  test("customer.subscription.deleted hydrates storage with the incoming state", async () => {
    await startSubscription({ userId: "u5", plan: "dealer-basic" });
    const sub = await getSubscription("u5");
    const stripeSubPayload = {
      id: sub!.stripeSubscriptionId,
      object: "subscription",
      customer: sub!.stripeCustomerId,
      status: "canceled",
      current_period_end: Math.floor(Date.now() / 1000) + 86400,
      cancel_at_period_end: false,
      items: { data: [] },
      metadata: { userId: "u5" },
    };
    const result = await handleWebhookEvent({
      id: "evt_sub_del",
      type: "customer.subscription.deleted",
      created: 0,
      data: { object: stripeSubPayload as unknown as Record<string, unknown> },
    });
    expect(result.handled).toBe(true);
    const after = await getSubscription("u5");
    expect(after?.status).toBe("cancelled");
  });

  test("subscription events without userId metadata are not handled", async () => {
    const result = await handleWebhookEvent({
      id: "evt_nometa",
      type: "customer.subscription.updated",
      created: 0,
      data: {
        object: {
          id: "sub_x",
          object: "subscription",
          customer: "cus_x",
          status: "active",
          current_period_end: 0,
          cancel_at_period_end: false,
          items: { data: [] },
          metadata: {},
        } as unknown as Record<string, unknown>,
      },
    });
    expect(result.handled).toBe(false);
    expect(result.reason).toBe("missing-user-metadata");
  });

  test("unhandled event types report reason without blowing up", async () => {
    const result = await handleWebhookEvent({
      id: "evt_odd",
      type: "some.unknown.event",
      created: 0,
      data: { object: {} },
    });
    expect(result.handled).toBe(false);
    expect(result.reason).toBe("unhandled-event-type");
  });

  test("deposit succeeded dispatches to Team 12 and backfills dealId", async () => {
    const { record } = await createDepositCharge({
      userId: "u1",
      buildRecordId: "bld_w",
      agreementId: "agr_w",
    });
    onDepositReceivedMock.mockClear();

    const result = await handleWebhookEvent({
      id: "evt_dep",
      type: "payment_intent.succeeded",
      created: 0,
      data: {
        object: {
          id: record.stripeRef,
          amount: 100000,
          metadata: {
            buildRecordId: "bld_w",
            agreementId: "agr_w",
            kind: "deposit",
            userId: "u1",
          },
        } as unknown as Record<string, unknown>,
      },
    });

    expect(onDepositReceivedMock).toHaveBeenCalledWith({
      userId: "u1",
      buildRecordId: "bld_w",
      agreementId: "agr_w",
      paymentId: record.id,
    });
    expect(result.dealId).toBe(`deal_${record.id}`);
    const after = await getPayment(record.id);
    expect(after?.dealId).toBe(`deal_${record.id}`);
  });

  test("succeeded webhook emits a payment notification for the user", async () => {
    const { record } = await createCharge({
      userId: "u1",
      amount: 15,
      kind: "lead-unlock",
    });
    emitNotificationMock.mockClear();
    await handleWebhookEvent({
      id: "evt_notif_ok",
      type: "payment_intent.succeeded",
      created: 0,
      data: {
        object: {
          id: record.stripeRef,
          amount: 1500,
          metadata: {},
        } as unknown as Record<string, unknown>,
      },
    });
    const call = emitNotificationMock.mock.calls[0] as unknown as [
      { userId: string; category: string; payload: { kind: string } },
    ];
    expect(call[0].userId).toBe("u1");
    expect(call[0].category).toBe("payment");
    expect(call[0].payload.kind).toBe("succeeded");
  });

  test("failed webhook emits a payment notification with kind=failed", async () => {
    const { record } = await createCharge({
      userId: "u1",
      amount: 5,
      kind: "listing-fee",
    });
    emitNotificationMock.mockClear();
    await handleWebhookEvent({
      id: "evt_notif_fail",
      type: "payment_intent.payment_failed",
      created: 0,
      data: {
        object: {
          id: record.stripeRef,
        } as unknown as Record<string, unknown>,
      },
    });
    const call = emitNotificationMock.mock.calls[0] as unknown as [
      { payload: { kind: string } },
    ];
    expect(call[0].payload.kind).toBe("failed");
  });

  test("notification-service outage does not break the webhook path", async () => {
    const { record } = await createCharge({
      userId: "u1",
      amount: 5,
      kind: "listing-fee",
    });
    emitNotificationMock.mockRejectedValueOnce(new Error("notif down"));
    const result = await handleWebhookEvent({
      id: "evt_notif_err",
      type: "payment_intent.succeeded",
      created: 0,
      data: {
        object: {
          id: record.stripeRef,
          amount: 500,
          metadata: {},
        } as unknown as Record<string, unknown>,
      },
    });
    expect(result.handled).toBe(true);
  });

  test("non-deposit succeeded events do not call Team 12", async () => {
    const { record } = await createCharge({
      userId: "u1",
      amount: 15,
      kind: "lead-unlock",
    });
    onDepositReceivedMock.mockClear();
    await handleWebhookEvent({
      id: "evt_non_dep",
      type: "payment_intent.succeeded",
      created: 0,
      data: {
        object: {
          id: record.stripeRef,
          amount: 1500,
          metadata: {},
        } as unknown as Record<string, unknown>,
      },
    });
    expect(onDepositReceivedMock).not.toHaveBeenCalled();
  });

  test("deposit succeeded without build/agreement metadata is still handled but skips dispatch", async () => {
    const { record } = await createCharge({
      userId: "u1",
      amount: 1000,
      kind: "deposit",
    });
    onDepositReceivedMock.mockClear();
    const result = await handleWebhookEvent({
      id: "evt_dep_no_meta",
      type: "payment_intent.succeeded",
      created: 0,
      data: {
        object: {
          id: record.stripeRef,
          amount: 100000,
          metadata: {},
        } as unknown as Record<string, unknown>,
      },
    });
    expect(onDepositReceivedMock).not.toHaveBeenCalled();
    expect(result.handled).toBe(true);
    expect(result.dealId).toBeUndefined();
  });
});

describe("synchronous confirm path", () => {
  test("deposit charged with confirmNow dispatches to Team 12", async () => {
    onDepositReceivedMock.mockClear();
    const { record } = await createDepositCharge({
      userId: "u1",
      buildRecordId: "bld_s",
      agreementId: "agr_s",
      paymentMethodId: "pm_card_visa",
    });
    expect(onDepositReceivedMock).toHaveBeenCalledWith({
      userId: "u1",
      buildRecordId: "bld_s",
      agreementId: "agr_s",
      paymentId: record.id,
    });
    // The service re-saves the record with the dealId stamped in.
    const stored = await getPayment(record.id);
    expect(stored?.dealId).toBe(`deal_${record.id}`);
  });

  test("succeeded sync charge also emits a notification", async () => {
    emitNotificationMock.mockClear();
    await createCharge({
      userId: "u1",
      amount: 15,
      kind: "lead-unlock",
      confirmNow: true,
    });
    expect(emitNotificationMock).toHaveBeenCalled();
  });
});

describe("bucket constants", () => {
  test("buckets match the documented names", () => {
    expect(PAYMENTS_BUCKET).toBe("payments");
    expect(SUBSCRIPTIONS_BUCKET).toBe("subscriptions");
    expect(STRIPE_EVENTS_BUCKET).toBe("stripe_events");
  });
});
