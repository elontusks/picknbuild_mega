import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createHmac } from "node:crypto";

import {
  createRealStripeClient,
  getStripeClient,
  setStripeClient,
  verifyStripeWebhook,
} from "@/lib/payments/stripe-client";

const FETCH_KEY = "sk_test_dummy";

const stubFetchOnce = (body: unknown, status = 200) => {
  const res = new Response(JSON.stringify(body), { status });
  return vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(res);
};

beforeEach(() => {
  setStripeClient(null);
});

afterEach(() => {
  vi.restoreAllMocks();
  setStripeClient(null);
  delete process.env.STRIPE_SECRET_KEY;
});

describe("setStripeClient / getStripeClient", () => {
  test("getStripeClient returns the override when set", () => {
    const mock = { id: "mock" } as never;
    setStripeClient(mock);
    expect(getStripeClient()).toBe(mock);
  });

  test("getStripeClient throws a clear error when no key is configured", () => {
    expect(() => getStripeClient()).toThrow(/STRIPE_SECRET_KEY/);
  });

  test("getStripeClient builds a real client from env when key is present", () => {
    process.env.STRIPE_SECRET_KEY = FETCH_KEY;
    const client = getStripeClient();
    expect(typeof client.createPaymentIntent).toBe("function");
  });
});

describe("createRealStripeClient.createPaymentIntent", () => {
  test("posts form-encoded payload with Basic auth and maps response", async () => {
    const fetchSpy = stubFetchOnce({
      id: "pi_123",
      object: "payment_intent",
      amount: 100000,
      currency: "usd",
      status: "requires_confirmation",
      client_secret: "pi_123_secret",
      customer: null,
      metadata: { userId: "u1" },
    });

    const client = createRealStripeClient(FETCH_KEY);
    const pi = await client.createPaymentIntent({
      amount: 100000,
      currency: "usd",
      metadata: { userId: "u1", kind: "deposit" },
    });

    expect(pi.id).toBe("pi_123");
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.stripe.com/v1/payment_intents");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toMatch(/^Basic /);
    expect(headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
    expect(String(init.body)).toContain("amount=100000");
    expect(String(init.body)).toContain("currency=usd");
    expect(String(init.body)).toContain(
      "metadata%5BuserId%5D=u1",
    );
    expect(String(init.body)).toContain(
      "metadata%5Bkind%5D=deposit",
    );
  });

  test("throws with Stripe error.message when the API returns an error", async () => {
    stubFetchOnce(
      { error: { message: "Your card was declined." } },
      402,
    );
    const client = createRealStripeClient(FETCH_KEY);
    await expect(
      client.createPaymentIntent({ amount: 1, currency: "usd" }),
    ).rejects.toThrow(/declined/);
  });
});

describe("createRealStripeClient.createRefund", () => {
  test("posts payment_intent id and optional amount", async () => {
    const fetchSpy = stubFetchOnce({
      id: "re_1",
      object: "refund",
      payment_intent: "pi_123",
      amount: 5000,
      currency: "usd",
      status: "succeeded",
      reason: null,
    });
    const client = createRealStripeClient(FETCH_KEY);
    await client.createRefund({ paymentIntentId: "pi_123", amount: 5000 });
    const body = String((fetchSpy.mock.calls[0] as [string, RequestInit])[1].body);
    expect(body).toContain("payment_intent=pi_123");
    expect(body).toContain("amount=5000");
  });
});

describe("createRealStripeClient.cancelSubscription", () => {
  test("DELETE when atPeriodEnd is false", async () => {
    const fetchSpy = stubFetchOnce({
      id: "sub_1",
      object: "subscription",
      customer: "cus_1",
      status: "canceled",
      current_period_end: 0,
      cancel_at_period_end: false,
      items: { data: [] },
      metadata: {},
    });
    const client = createRealStripeClient(FETCH_KEY);
    await client.cancelSubscription("sub_1", { atPeriodEnd: false });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.stripe.com/v1/subscriptions/sub_1");
    expect(init.method).toBe("DELETE");
  });

  test("POST cancel_at_period_end=true when atPeriodEnd is true", async () => {
    const fetchSpy = stubFetchOnce({
      id: "sub_1",
      object: "subscription",
      customer: "cus_1",
      status: "active",
      current_period_end: 0,
      cancel_at_period_end: true,
      items: { data: [] },
      metadata: {},
    });
    const client = createRealStripeClient(FETCH_KEY);
    await client.cancelSubscription("sub_1", { atPeriodEnd: true });
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(String(init.body)).toContain("cancel_at_period_end=true");
  });
});

describe("verifyStripeWebhook", () => {
  const SECRET = "whsec_test";
  const buildSignature = (payload: string, timestamp: number) => {
    const expected = createHmac("sha256", SECRET)
      .update(`${timestamp}.${payload}`, "utf8")
      .digest("hex");
    return `t=${timestamp},v1=${expected}`;
  };

  test("parses the event when signature matches and timestamp is fresh", () => {
    const event = {
      id: "evt_1",
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_1" } },
      created: 0,
    };
    const payload = JSON.stringify(event);
    const now = 1_700_000_000;
    const sig = buildSignature(payload, now);
    const parsed = verifyStripeWebhook({
      payload,
      signature: sig,
      secret: SECRET,
      nowSeconds: now,
    });
    expect(parsed.id).toBe("evt_1");
  });

  test("rejects a stale timestamp", () => {
    const payload = JSON.stringify({ id: "evt_old" });
    const sig = buildSignature(payload, 1);
    expect(() =>
      verifyStripeWebhook({
        payload,
        signature: sig,
        secret: SECRET,
        nowSeconds: 1_000_000,
      }),
    ).toThrow(/tolerance/);
  });

  test("rejects a tampered signature", () => {
    const payload = JSON.stringify({ id: "evt_tampered" });
    const now = 1_700_000_000;
    const badSig = `t=${now},v1=${"0".repeat(64)}`;
    expect(() =>
      verifyStripeWebhook({
        payload,
        signature: badSig,
        secret: SECRET,
        nowSeconds: now,
      }),
    ).toThrow(/mismatch/);
  });

  test("rejects a malformed header", () => {
    expect(() =>
      verifyStripeWebhook({
        payload: "{}",
        signature: "garbage",
        secret: SECRET,
        nowSeconds: 1,
      }),
    ).toThrow(/malformed/);
  });
});
