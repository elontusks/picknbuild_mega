import { nextFixtureId, nowIso, type ISOTimestamp } from "./common";

export type PaymentKind =
  | "deposit"
  | "subscription"
  | "lead-unlock"
  | "listing-fee"
  | "refund"
  | "balance";

export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";

export type PaymentRecord = {
  id: string;
  userId: string;
  kind: PaymentKind;
  amount: number;
  currency: "USD";
  stripeRef: string;
  status: PaymentStatus;
  dealId?: string;
  createdAt: ISOTimestamp;
};

export const makeFixturePaymentRecord = (
  overrides: Partial<PaymentRecord> = {},
): PaymentRecord => ({
  id: nextFixtureId("pay"),
  userId: "user_fixture",
  kind: "deposit",
  amount: 1000,
  currency: "USD",
  stripeRef: "ch_fixture",
  status: "succeeded",
  createdAt: nowIso(),
  ...overrides,
});
