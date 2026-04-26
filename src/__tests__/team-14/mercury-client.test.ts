import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createHmac } from "node:crypto";

import {
  createRealMercuryClient,
  getMercuryClient,
  setMercuryClient,
} from "@/lib/payments/mercury-client";

const API_KEY = "secret-token:mercury_test_dummy";

const stubFetchOnce = (body: unknown, status = 200) => {
  const res = new Response(JSON.stringify(body), { status });
  return vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(res);
};

beforeEach(() => {
  setMercuryClient(null);
});

afterEach(() => {
  vi.restoreAllMocks();
  setMercuryClient(null);
  delete process.env.MERCURY_API_KEY;
});

describe("setMercuryClient / getMercuryClient", () => {
  test("getMercuryClient returns the override when set", () => {
    const mock = { id: "mock" } as never;
    setMercuryClient(mock);
    expect(getMercuryClient()).toBe(mock);
  });

  test("getMercuryClient throws a clear error when no key is configured", () => {
    expect(() => getMercuryClient()).toThrow(/MERCURY_API_KEY/);
  });

  test("getMercuryClient builds a real client from env when key is present", () => {
    process.env.MERCURY_API_KEY = API_KEY;
    const client = getMercuryClient();
    expect(typeof client.getAccount).toBe("function");
  });
});

describe("createRealMercuryClient.getAccount", () => {
  test("fetches account with Bearer auth and maps response", async () => {
    const fetchSpy = stubFetchOnce({
      id: "acct_123",
      accountNumber: "123456789",
      routingNumber: "021000021",
      name: "Mercury Checking",
      status: "active",
      type: "mercury",
      createdAt: "2025-01-01T00:00:00Z",
      availableBalance: 100000,
      currentBalance: 100000,
      kind: "checking",
      legalBusinessName: "Test Corp",
    });

    const client = createRealMercuryClient(API_KEY);
    const account = await client.getAccount("acct_123");

    expect(account.id).toBe("acct_123");
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("accounts/acct_123");
    expect(init.method).toBe("GET");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Bearer ${API_KEY}`);
  });

  test("throws with Mercury error message when API returns error", async () => {
    stubFetchOnce({ message: "Account not found" }, 404);
    const client = createRealMercuryClient(API_KEY);
    await expect(client.getAccount("invalid")).rejects.toThrow(/Account not found/);
  });
});

describe("createRealMercuryClient.listTransactions", () => {
  test("fetches transactions with filters and maps response", async () => {
    const fetchSpy = stubFetchOnce({
      transactions: [
        {
          id: "txn_1",
          type: "ach",
          direction: "in",
          status: "posted",
          amount: 100000,
          accountId: "acct_123",
          counterpartyName: "John Doe",
          reference: "deal_123",
          createdAt: "2025-01-01T00:00:00Z",
          postedAt: "2025-01-01T12:00:00Z",
        },
      ],
    });

    const client = createRealMercuryClient(API_KEY);
    const txns = await client.listTransactions({
      accountId: "acct_123",
      limit: 10,
      status: "posted",
    });

    expect(txns).toHaveLength(1);
    expect(txns[0].id).toBe("txn_1");
    const [url] = fetchSpy.mock.calls[0] as [string];
    expect(url).toContain("status=posted");
  });
});

describe("createRealMercuryClient.createAchTransfer", () => {
  test("posts ACH transfer request with account details", async () => {
    const fetchSpy = stubFetchOnce({
      id: "txn_out_1",
      type: "ach",
      direction: "out",
      status: "pending",
      amount: 50000,
      accountId: "acct_123",
      counterpartyName: "Jane Doe",
      counterpartyRoutingNumber: "021000021",
      counterpartyAccountNumber: "987654321",
      reference: "refund_pay_123",
      createdAt: "2025-01-01T00:00:00Z",
    });

    const client = createRealMercuryClient(API_KEY);
    const txn = await client.createAchTransfer({
      accountId: "acct_123",
      amount: 50000,
      counterpartyName: "Jane Doe",
      counterpartyRoutingNumber: "021000021",
      counterpartyAccountNumber: "987654321",
      reference: "refund_pay_123",
    });

    expect(txn.id).toBe("txn_out_1");
    expect(txn.direction).toBe("out");
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    const body = JSON.parse(String(init.body));
    expect(body.amount).toBe(50000);
    expect(body.counterpartyName).toBe("Jane Doe");
  });
});

describe("verifyMercuryWebhook", () => {
  const SECRET = "webhook_secret_test";

  const buildSignature = (payload: string, timestamp: number) => {
    const signed = `${timestamp}.${payload}`;
    const sig = createHmac("sha256", SECRET)
      .update(signed, "utf8")
      .digest("base64");
    return sig;
  };

  test("parses event when signature matches", () => {
    const event = {
      id: "evt_1",
      timestamp: 1700000000,
      type: "transaction.created",
      data: {
        transaction: {
          id: "txn_1",
          type: "ach",
          direction: "in",
          status: "posted",
          amount: 100000,
          accountId: "acct_123",
          counterpartyName: "John",
          reference: "deal_123",
          createdAt: "2025-01-01T00:00:00Z",
        },
      },
    };
    const payload = JSON.stringify(event);
    const sig = buildSignature(payload, event.timestamp);

    const client = createRealMercuryClient(API_KEY);
    const parsed = client.verifyWebhook({
      payload,
      signature: sig,
      secret: SECRET,
    });

    expect(parsed.id).toBe("evt_1");
  });

  test("rejects tampered signature", () => {
    const payload = JSON.stringify({
      id: "evt_2",
      timestamp: 1700000000,
      type: "transaction.created",
      data: {},
    });
    const badSig = Buffer.from("bad signature").toString("base64");

    const client = createRealMercuryClient(API_KEY);
    expect(() =>
      client.verifyWebhook({
        payload,
        signature: badSig,
        secret: SECRET,
      }),
    ).toThrow(/mismatch/);
  });
});
