import {
  makeFixturePaymentRecord,
  type PaymentKind,
  type PaymentRecord,
} from "@/contracts";

export type ChargeInput = {
  userId: string;
  amount: number;
  kind: PaymentKind;
  dealId?: string;
  metadata?: Record<string, string>;
};

export const createCharge = async (input: ChargeInput): Promise<PaymentRecord> =>
  makeFixturePaymentRecord({
    userId: input.userId,
    amount: input.amount,
    kind: input.kind,
    dealId: input.dealId,
    status: "succeeded",
    stripeRef: `ch_stub_${Date.now()}`,
  });

export const createDepositCharge = async (input: {
  userId: string;
  buildRecordId: string;
  agreementId: string;
}): Promise<PaymentRecord> =>
  createCharge({
    userId: input.userId,
    amount: 1000,
    kind: "deposit",
    metadata: {
      buildRecordId: input.buildRecordId,
      agreementId: input.agreementId,
    },
  });

export const issueRefund = async (input: {
  paymentId: string;
  reason: string;
}): Promise<PaymentRecord> =>
  makeFixturePaymentRecord({
    kind: "refund",
    status: "refunded",
    stripeRef: `re_stub_${Date.now()}`,
  });

export type Subscription = {
  id: string;
  userId: string;
  plan: "dealer-basic" | "dealer-pro";
  status: "active" | "past_due" | "cancelled";
  currentPeriodEnd: string;
};

export const getSubscription = async (
  userId: string,
): Promise<Subscription | null> => ({
  id: `sub_${userId}`,
  userId,
  plan: "dealer-basic",
  status: "active",
  currentPeriodEnd: new Date(Date.now() + 30 * 86400 * 1000).toISOString(),
});

export const startSubscription = async (input: {
  userId: string;
  plan: "dealer-basic" | "dealer-pro";
}): Promise<Subscription> => ({
  id: `sub_${input.userId}`,
  userId: input.userId,
  plan: input.plan,
  status: "active",
  currentPeriodEnd: new Date(Date.now() + 30 * 86400 * 1000).toISOString(),
});

export const retryFailedPayment = async (input: {
  paymentId: string;
}): Promise<PaymentRecord> =>
  makeFixturePaymentRecord({ status: "succeeded" });

export const listPaymentsForUser = async (
  userId: string,
): Promise<PaymentRecord[]> => [
  makeFixturePaymentRecord({ userId, kind: "deposit", amount: 1000 }),
  makeFixturePaymentRecord({ userId, kind: "balance", amount: 180 }),
];

export const getWireInstructions = async (input: {
  dealId: string;
}): Promise<{
  routingNumber: string;
  accountNumber: string;
  beneficiary: string;
  reference: string;
}> => ({
  routingNumber: "123456789",
  accountNumber: "000111222",
  beneficiary: "PicknBuild Escrow LLC",
  reference: input.dealId,
});
