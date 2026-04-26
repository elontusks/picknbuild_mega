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
  onDepositReceived: (...args: Parameters<typeof onDepositReceivedMock>) =>
    onDepositReceivedMock(...args),
}));

const emitNotificationMock = vi.fn(async () => []);
vi.mock("@/services/team-13-notifications", () => ({
  emitNotification: (...args: unknown[]) =>
    emitNotificationMock(...(args as [])),
}));

import {
  cancelSubscription,
  createCharge,
  createDepositCharge,
  getPayment,
  getSubscription,
  handleWebhookEvent,
  listPaymentsForUser,
  MERCURY_EVENTS_BUCKET,
  PAYMENTS_BUCKET,
  startSubscription,
  SUBSCRIPTIONS_BUCKET,
} from "@/services/team-14-payments";
import {
  setMercuryClient,
  type MercuryClient,
  type MercuryTransaction,
} from "@/lib/payments/mercury-client";

const makeMockMercury = (): MercuryClient & {
  transactions: Map<string, MercuryTransaction>;
} => {
  let txnCounter = 0;
  const transactions = new Map<string, MercuryTransaction>();

  const client: MercuryClient = {
    getAccount: async () => ({
      id: "acct_test",
      accountNumber: "123456789",
      routingNumber: "021000021",
      name: "Mercury Test",
      status: "active",
      type: "mercury",
      createdAt: new Date().toISOString(),
      availableBalance: 1000000,
      currentBalance: 1000000,
      kind: "checking",
      legalBusinessName: "Test Corp",
    }),

    listTransactions: async () => Array.from(transactions.values()),

    getTransaction: async (accountId, txnId) => {
      const txn = transactions.get(txnId);
      if (!txn) throw new Error("transaction not found");
      return txn;
    },

    createAchTransfer: async (input) => {
      txnCounter += 1;
      const txn: MercuryTransaction = {
        id: `txn_out_${txnCounter}`,
        type: "ach",
        direction: "out",
        status: "pending",
        amount: input.amount,
        accountId: input.accountId,
        counterpartyName: input.counterpartyName,
        counterpartyRoutingNumber: input.counterpartyRoutingNumber,
        counterpartyAccountNumber: input.counterpartyAccountNumber,
        reference: input.reference,
        createdAt: new Date().toISOString(),
      };
      transactions.set(txn.id, txn);
      return txn;
    },

    verifyWebhook: (input) => {
      const parsed = JSON.parse(input.payload);
      return parsed;
    },
  };

  return Object.assign(client, { transactions });
};

let mercury: ReturnType<typeof makeMockMercury>;

beforeEach(() => {
  buckets.clear();
  onDepositReceivedMock.mockClear();
  emitNotificationMock.mockClear();
  mercury = makeMockMercury();
  setMercuryClient(mercury);
  process.env.MERCURY_ACCOUNT_ID = "acct_test";
  process.env.PICKNBUILD_WIRE_ROUTING = "091311229";
  process.env.PICKNBUILD_WIRE_ACCOUNT = "202524769867";
  process.env.PICKNBUILD_WIRE_BANK = "Mercury Bank";
});

afterEach(() => {
  setMercuryClient(null);
  delete process.env.MERCURY_ACCOUNT_ID;
});

describe("createCharge (Mercury — creates pending record)", () => {
  test("creates a pending PaymentRecord and returns wire instructions", async () => {
    process.env.PICKNBUILD_WIRE_ROUTING = "091311229";
    process.env.PICKNBUILD_WIRE_ACCOUNT = "202524769867";

    const result = await createCharge({
      userId: "u1",
      amount: 1000,
      kind: "deposit",
    });

    expect(result.record.status).toBe("pending");
    expect(result.record.amount).toBe(1000);
    expect(result.record.mercuryRef).toBe(""); // Set later when txn arrives
    expect(result.wireInstructions.routingNumber).toBe("091311229");
    expect(result.wireInstructions.accountNumber).toBe("202524769867");
    expect(result.wireInstructions.reference).toBeDefined();
  });
});

describe("createDepositCharge", () => {
  test("charges $1,000 with deposit kind, has dealId", async () => {
    const result = await createDepositCharge({
      userId: "u1",
      buildRecordId: "bld_1",
      agreementId: "agr_1",
    });
    expect(result.record.amount).toBe(1000);
    expect(result.record.kind).toBe("deposit");
    // dealId is set to the record id if not provided
    expect(result.record.dealId).toBe(result.record.id);
  });
});

describe("subscriptions (Mercury manual renewal)", () => {
  test("startSubscription creates an active subscription record", async () => {
    const sub = await startSubscription({
      userId: "u1",
      plan: "dealer-basic",
    });
    expect(sub.status).toBe("active");
    expect(sub.plan).toBe("dealer-basic");
    expect(sub.amountUsd).toBe(99);

    const stored = await getSubscription("u1");
    expect(stored?.id).toBe(sub.id);
  });

  test("cancelSubscription marks subscription as cancelled", async () => {
    await startSubscription({
      userId: "u2",
      plan: "dealer-basic",
    });
    const updated = await cancelSubscription({ userId: "u2" });
    expect(updated.status).toBe("cancelled");
    expect(updated.cancelledAt).toBeDefined();
  });

  test("cancelSubscription throws when no subscription exists", async () => {
    await expect(cancelSubscription({ userId: "ghost" })).rejects.toThrow(
      /no subscription/,
    );
  });
});

describe("handleWebhookEvent (Mercury transaction webhook)", () => {
  test("transaction.created with posted inbound ACH matches and succeeds payment", async () => {
    // Create pending charge
    const { record } = await createCharge({
      userId: "u1",
      amount: 1000,
      kind: "deposit",
      dealId: "deal_1",
    });

    // Simulate Mercury webhook for incoming transaction
    const txn: MercuryTransaction = {
      id: "txn_in_1",
      type: "ach",
      direction: "in",
      status: "posted",
      amount: 100000, // cents
      accountId: "acct_test",
      counterpartyName: "Customer",
      reference: "deal_1",
      createdAt: new Date().toISOString(),
      postedAt: new Date().toISOString(),
    };

    const result = await handleWebhookEvent({
      id: "evt_1",
      timestamp: Math.floor(Date.now() / 1000),
      type: "transaction.created",
      data: { transaction: txn },
    });

    expect(result.handled).toBe(true);
    const after = await getPayment(record.id);
    expect(after?.status).toBe("succeeded");
    expect(after?.mercuryRef).toBe("txn_in_1");
  });

  test("ignores pending transactions (not posted)", async () => {
    const txn: MercuryTransaction = {
      id: "txn_pending",
      type: "ach",
      direction: "in",
      status: "pending",
      amount: 100000,
      accountId: "acct_test",
      counterpartyName: "Customer",
      reference: "deal_1",
      createdAt: new Date().toISOString(),
    };

    const result = await handleWebhookEvent({
      id: "evt_pending",
      timestamp: Math.floor(Date.now() / 1000),
      type: "transaction.created",
      data: { transaction: txn },
    });

    expect(result.handled).toBe(false);
    expect(result.reason).toBe("not-posted-inbound-transaction");
  });

  test("ignores outbound transactions", async () => {
    const txn: MercuryTransaction = {
      id: "txn_out",
      type: "ach",
      direction: "out",
      status: "posted",
      amount: 100000,
      accountId: "acct_test",
      counterpartyName: "Customer",
      reference: "deal_1",
      createdAt: new Date().toISOString(),
      postedAt: new Date().toISOString(),
    };

    const result = await handleWebhookEvent({
      id: "evt_out",
      timestamp: Math.floor(Date.now() / 1000),
      type: "transaction.created",
      data: { transaction: txn },
    });

    expect(result.handled).toBe(false);
  });

  test("duplicate events are ignored (idempotent)", async () => {
    const { record } = await createCharge({
      userId: "u1",
      amount: 1000,
      kind: "deposit",
      dealId: "deal_2",
    });

    const txn: MercuryTransaction = {
      id: "txn_dup",
      type: "ach",
      direction: "in",
      status: "posted",
      amount: 100000,
      accountId: "acct_test",
      counterpartyName: "Customer",
      reference: "deal_2",
      createdAt: new Date().toISOString(),
      postedAt: new Date().toISOString(),
    };

    const evt = {
      id: "evt_dup",
      timestamp: Math.floor(Date.now() / 1000),
      type: "transaction.created" as const,
      data: { transaction: txn },
    };

    await handleWebhookEvent(evt);
    const second = await handleWebhookEvent(evt);

    expect(second.handled).toBe(false);
    expect(second.reason).toBe("duplicate");
    expect(getBucket(MERCURY_EVENTS_BUCKET).size).toBe(1);
  });

  test("deposit succeeded dispatches to Team 12", async () => {
    const { record } = await createDepositCharge({
      userId: "u1",
      buildRecordId: "bld_1",
      agreementId: "agr_1",
    });
    onDepositReceivedMock.mockClear();

    // The reference should match the dealId for the payment to be matched
    const txn: MercuryTransaction = {
      id: "txn_dep",
      type: "ach",
      direction: "in",
      status: "posted",
      amount: 100000,
      accountId: "acct_test",
      counterpartyName: "Customer",
      reference: record.id, // Match the payment record id (which is the dealId)
      createdAt: new Date().toISOString(),
      postedAt: new Date().toISOString(),
    };

    await handleWebhookEvent({
      id: "evt_dep",
      timestamp: Math.floor(Date.now() / 1000),
      type: "transaction.created",
      data: { transaction: txn },
    });

    expect(onDepositReceivedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        buildRecordId: "bld_1",
        agreementId: "agr_1",
      }),
    );
  });

  test("succeeded webhook emits a payment notification", async () => {
    const { record } = await createCharge({
      userId: "u1",
      amount: 15,
      kind: "lead-unlock",
      dealId: "deal_notif",
    });
    emitNotificationMock.mockClear();

    const txn: MercuryTransaction = {
      id: "txn_notif",
      type: "ach",
      direction: "in",
      status: "posted",
      amount: 1500,
      accountId: "acct_test",
      counterpartyName: "Customer",
      reference: "deal_notif",
      createdAt: new Date().toISOString(),
      postedAt: new Date().toISOString(),
    };

    await handleWebhookEvent({
      id: "evt_notif",
      timestamp: Math.floor(Date.now() / 1000),
      type: "transaction.created",
      data: { transaction: txn },
    });

    const call = emitNotificationMock.mock.calls[0] as unknown as [
      { userId: string; category: string; payload: { kind: string } },
    ];
    expect(call[0].category).toBe("payment");
    expect(call[0].payload.kind).toBe("succeeded");
  });
});

describe("bucket constants", () => {
  test("buckets match the documented names", () => {
    expect(PAYMENTS_BUCKET).toBe("payments");
    expect(SUBSCRIPTIONS_BUCKET).toBe("subscriptions");
    expect(MERCURY_EVENTS_BUCKET).toBe("mercury_events");
  });
});
