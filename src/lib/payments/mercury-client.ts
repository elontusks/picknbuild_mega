import "server-only";

// Mercury Bank API client for ACH/wire payment handling.
// Webhooks arrive with HMAC-SHA256 signature in x-hub-signature header.
// Format: base64(HMAC-SHA256(secret, timestamp.payload))

const MERCURY_API = "https://api.mercury.com/api/v1";

export type MercuryTransaction = {
  id: string;
  type: "wire" | "ach" | "check" | "card" | "other";
  direction: "in" | "out";
  status: "pending" | "posted" | "failed" | "canceled";
  amount: number; // in cents
  accountId: string;
  counterpartyName: string;
  counterpartyRoutingNumber?: string;
  counterpartyAccountNumber?: string;
  reference: string; // ACH/wire reference, often our deal ID
  createdAt: string; // ISO timestamp
  postedAt?: string; // ISO timestamp when settled
  memo?: string;
  incomingAchReturn?: {
    code: string;
    description: string;
  };
};

export type MercuryAccount = {
  id: string;
  accountNumber: string;
  routingNumber: string;
  name: string;
  status: "active" | "inactive";
  type: "mercury";
  createdAt: string;
  availableBalance: number; // in cents
  currentBalance: number; // in cents
  kind: "checking" | "savings";
  legalBusinessName: string;
};

export type MercuryWebhookEvent = {
  id: string;
  timestamp: number; // unix seconds
  type: string; // "transaction.created", "transaction.updated", "account.updated"
  data: {
    transaction?: MercuryTransaction;
    account?: MercuryAccount;
  };
};

export interface MercuryClient {
  getAccount(accountId: string): Promise<MercuryAccount>;
  listTransactions(input: {
    accountId: string;
    limit?: number;
    offset?: number;
    status?: MercuryTransaction["status"];
  }): Promise<MercuryTransaction[]>;
  getTransaction(
    accountId: string,
    transactionId: string,
  ): Promise<MercuryTransaction>;
  createAchTransfer(input: {
    accountId: string;
    amount: number; // cents
    counterpartyName: string;
    counterpartyRoutingNumber: string;
    counterpartyAccountNumber: string;
    reference: string;
    memo?: string;
  }): Promise<MercuryTransaction>;
  verifyWebhook(input: {
    payload: string;
    signature: string;
    secret: string;
  }): MercuryWebhookEvent;
}

const mercuryRequest = async <T>(
  apiKey: string,
  method: "GET" | "POST" | "DELETE",
  path: string,
  body?: Record<string, unknown>,
): Promise<T> => {
  const url = `${MERCURY_API}${path}`;
  const init: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  };
  if (body && method !== "GET") {
    init.body = JSON.stringify(body);
  }
  const res = await fetch(url, init);
  const json = (await res.json().catch(() => ({}))) as unknown;
  if (!res.ok) {
    const err =
      (json as { message?: string; errors?: { message?: string } })
        .message ??
      (json as { errors?: { message?: string } }).errors?.message ??
      `Mercury ${method} ${path} failed (${res.status})`;
    throw new Error(`[mercury] ${err}`);
  }
  return json as T;
};

// --- Webhook signature verification ----------------------------------------
// Mercury signs webhooks with HMAC-SHA256(secret, timestamp.rawBody).
// Signature comes as base64 in x-hub-signature header.

const verifyMercuryWebhook = (input: {
  payload: string;
  signature: string;
  secret: string;
}): MercuryWebhookEvent => {
  const { payload, signature, secret } = input;

  // Dynamic import so browser bundle doesn't drag node:crypto in.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createHmac } = require("node:crypto") as typeof import("node:crypto");

  // Mercury signature is base64(HMAC-SHA256(secret, timestamp.payload))
  // Extract timestamp from payload first
  const parsed = JSON.parse(payload) as MercuryWebhookEvent;
  const timestamp = parsed.timestamp;

  // Recreate the signed string: timestamp.payload (as bytes)
  const signedString = `${timestamp}.${payload}`;
  const expected = createHmac("sha256", secret)
    .update(signedString, "utf8")
    .digest("base64");

  if (signature !== expected) {
    throw new Error("[mercury] webhook signature mismatch");
  }

  return parsed;
};

export const createRealMercuryClient = (apiKey: string): MercuryClient => ({
  getAccount: (accountId) =>
    mercuryRequest<MercuryAccount>(apiKey, "GET", `/accounts/${accountId}`),

  listTransactions: (input) =>
    mercuryRequest<{ transactions: MercuryTransaction[] }>(
      apiKey,
      "GET",
      `/accounts/${input.accountId}/transactions?limit=${input.limit ?? 100}&offset=${input.offset ?? 0}${
        input.status ? `&status=${input.status}` : ""
      }`,
    ).then((res) => res.transactions),

  getTransaction: (accountId, transactionId) =>
    mercuryRequest<MercuryTransaction>(
      apiKey,
      "GET",
      `/accounts/${accountId}/transactions/${transactionId}`,
    ),

  createAchTransfer: (input) =>
    mercuryRequest<MercuryTransaction>(apiKey, "POST", "/transfers", {
      accountId: input.accountId,
      type: "ach",
      amount: input.amount,
      counterpartyName: input.counterpartyName,
      counterpartyRoutingNumber: input.counterpartyRoutingNumber,
      counterpartyAccountNumber: input.counterpartyAccountNumber,
      reference: input.reference,
      memo: input.memo,
    }),

  verifyWebhook: ({ payload, signature, secret }) =>
    verifyMercuryWebhook({ payload, signature, secret }),
});

let override: MercuryClient | null = null;

export const setMercuryClient = (client: MercuryClient | null): void => {
  override = client;
};

export const getMercuryClient = (): MercuryClient => {
  if (override) return override;
  const key = process.env.MERCURY_API_KEY;
  if (!key) {
    throw new Error(
      "[mercury] MERCURY_API_KEY is not set — configure a live key or inject a mock via setMercuryClient()",
    );
  }
  return createRealMercuryClient(key);
};
