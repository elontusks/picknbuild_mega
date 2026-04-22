import "server-only";

// Minimal Stripe REST client built on fetch. We don't add the stripe SDK as a
// dep — the few endpoints we touch (PaymentIntents, Refunds, Customers,
// Subscriptions, Webhook signature verification) are straightforward form-
// encoded calls.
//
// The live implementation is activated by STRIPE_SECRET_KEY. Tests swap it
// out via setStripeClient(mock). Test keys (sk_test_*) and live keys both
// work through the same code path — the key itself determines mode.

const STRIPE_API = "https://api.stripe.com/v1";

export type StripePaymentIntent = {
  id: string;
  object: "payment_intent";
  amount: number;
  currency: string;
  status:
    | "requires_payment_method"
    | "requires_confirmation"
    | "requires_action"
    | "processing"
    | "requires_capture"
    | "canceled"
    | "succeeded";
  client_secret: string | null;
  customer: string | null;
  metadata: Record<string, string>;
};

export type StripeRefund = {
  id: string;
  object: "refund";
  payment_intent: string | null;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "canceled";
  reason: string | null;
};

export type StripeCustomer = {
  id: string;
  object: "customer";
  email: string | null;
  metadata: Record<string, string>;
};

export type StripeSubscription = {
  id: string;
  object: "subscription";
  customer: string;
  status:
    | "active"
    | "past_due"
    | "unpaid"
    | "canceled"
    | "incomplete"
    | "incomplete_expired"
    | "trialing";
  current_period_end: number; // unix seconds
  cancel_at_period_end: boolean;
  items: { data: { price: { id: string } }[] };
  metadata: Record<string, string>;
};

export type StripeWebhookEvent = {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
  created: number;
};

export interface StripeClient {
  createPaymentIntent(input: {
    amount: number; // cents
    currency: "usd";
    metadata?: Record<string, string>;
    customer?: string;
    paymentMethod?: string;
    confirm?: boolean;
    description?: string;
  }): Promise<StripePaymentIntent>;
  retrievePaymentIntent(id: string): Promise<StripePaymentIntent>;
  createRefund(input: {
    paymentIntentId: string;
    amount?: number; // cents, optional partial
    reason?: string;
  }): Promise<StripeRefund>;
  createCustomer(input: {
    email?: string;
    metadata?: Record<string, string>;
  }): Promise<StripeCustomer>;
  createSubscription(input: {
    customer: string;
    priceId: string;
    metadata?: Record<string, string>;
  }): Promise<StripeSubscription>;
  cancelSubscription(
    subscriptionId: string,
    opts?: { atPeriodEnd?: boolean },
  ): Promise<StripeSubscription>;
  retrieveSubscription(subscriptionId: string): Promise<StripeSubscription>;
  verifyWebhook(input: {
    payload: string;
    signature: string;
    secret: string;
  }): StripeWebhookEvent;
}

const formEncode = (obj: Record<string, unknown>, prefix = ""): string => {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;
    const encodedKey = prefix ? `${prefix}[${key}]` : key;
    if (typeof value === "object" && !Array.isArray(value)) {
      parts.push(formEncode(value as Record<string, unknown>, encodedKey));
    } else {
      parts.push(
        `${encodeURIComponent(encodedKey)}=${encodeURIComponent(String(value))}`,
      );
    }
  }
  return parts.filter(Boolean).join("&");
};

const stripeRequest = async <T>(
  secretKey: string,
  method: "GET" | "POST" | "DELETE",
  path: string,
  body?: Record<string, unknown>,
): Promise<T> => {
  const url = `${STRIPE_API}${path}`;
  const init: RequestInit = {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };
  if (body && method !== "GET") {
    init.body = formEncode(body);
  }
  const res = await fetch(url, init);
  const json = (await res.json().catch(() => ({}))) as unknown;
  if (!res.ok) {
    const err =
      (json as { error?: { message?: string } }).error?.message ??
      `Stripe ${method} ${path} failed (${res.status})`;
    throw new Error(`[stripe] ${err}`);
  }
  return json as T;
};

// --- Webhook signature verification --------------------------------------
//
// Stripe signs webhooks with HMAC-SHA256. The header shape is
// `t=<timestamp>,v1=<sig>[,v1=<sig2>...]`. We verify against a shared secret,
// reject events older than the tolerance window (5 minutes), and constant-
// time compare the signature.

const TOLERANCE_SECONDS = 300;

const parseSigHeader = (header: string): { timestamp: number; v1: string[] } => {
  const parts = header.split(",").map((p) => p.trim());
  let timestamp = 0;
  const v1: string[] = [];
  for (const part of parts) {
    const [k, v] = part.split("=");
    if (!k || !v) continue;
    if (k === "t") timestamp = Number(v);
    else if (k === "v1") v1.push(v);
  }
  return { timestamp, v1 };
};

const constantTimeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
};

export const verifyStripeWebhook = (input: {
  payload: string;
  signature: string;
  secret: string;
  nowSeconds?: number;
}): StripeWebhookEvent => {
  const { payload, signature, secret } = input;
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  const { timestamp, v1 } = parseSigHeader(signature);
  if (!timestamp || v1.length === 0) {
    throw new Error("[stripe] webhook signature header malformed");
  }
  if (Math.abs(now - timestamp) > TOLERANCE_SECONDS) {
    throw new Error("[stripe] webhook timestamp outside tolerance");
  }
  // Dynamic import so the browser bundle doesn't drag node:crypto in.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createHmac } = require("node:crypto") as typeof import("node:crypto");
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`, "utf8")
    .digest("hex");
  if (!v1.some((sig) => constantTimeEqual(sig, expected))) {
    throw new Error("[stripe] webhook signature mismatch");
  }
  const parsed = JSON.parse(payload) as StripeWebhookEvent;
  return parsed;
};

export const createRealStripeClient = (secretKey: string): StripeClient => ({
  createPaymentIntent: (input) =>
    stripeRequest<StripePaymentIntent>(secretKey, "POST", "/payment_intents", {
      amount: input.amount,
      currency: input.currency,
      description: input.description,
      customer: input.customer,
      payment_method: input.paymentMethod,
      confirm: input.confirm ? "true" : undefined,
      metadata: input.metadata,
    }),
  retrievePaymentIntent: (id) =>
    stripeRequest<StripePaymentIntent>(
      secretKey,
      "GET",
      `/payment_intents/${encodeURIComponent(id)}`,
    ),
  createRefund: (input) =>
    stripeRequest<StripeRefund>(secretKey, "POST", "/refunds", {
      payment_intent: input.paymentIntentId,
      amount: input.amount,
      reason: input.reason,
    }),
  createCustomer: (input) =>
    stripeRequest<StripeCustomer>(secretKey, "POST", "/customers", {
      email: input.email,
      metadata: input.metadata,
    }),
  createSubscription: (input) =>
    stripeRequest<StripeSubscription>(secretKey, "POST", "/subscriptions", {
      customer: input.customer,
      items: { "0": { price: input.priceId } },
      metadata: input.metadata,
    }),
  cancelSubscription: (subscriptionId, opts) =>
    opts?.atPeriodEnd
      ? stripeRequest<StripeSubscription>(
          secretKey,
          "POST",
          `/subscriptions/${encodeURIComponent(subscriptionId)}`,
          { cancel_at_period_end: "true" },
        )
      : stripeRequest<StripeSubscription>(
          secretKey,
          "DELETE",
          `/subscriptions/${encodeURIComponent(subscriptionId)}`,
        ),
  retrieveSubscription: (subscriptionId) =>
    stripeRequest<StripeSubscription>(
      secretKey,
      "GET",
      `/subscriptions/${encodeURIComponent(subscriptionId)}`,
    ),
  verifyWebhook: ({ payload, signature, secret }) =>
    verifyStripeWebhook({ payload, signature, secret }),
});

let override: StripeClient | null = null;

export const setStripeClient = (client: StripeClient | null): void => {
  override = client;
};

export const getStripeClient = (): StripeClient => {
  if (override) return override;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "[stripe] STRIPE_SECRET_KEY is not set — configure a test-mode key or inject a mock via setStripeClient()",
    );
  }
  return createRealStripeClient(key);
};
