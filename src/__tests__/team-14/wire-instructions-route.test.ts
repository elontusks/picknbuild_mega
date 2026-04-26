import { beforeEach, describe, expect, test, vi } from "vitest";
import type { PaymentRecord } from "@/contracts";

const loadPrincipalMock = vi.fn();
vi.mock("@/lib/authz/server/principal-loader", () => ({
  loadPrincipal: (...args: unknown[]) => loadPrincipalMock(...(args as [])),
}));

const listPaymentsForDealMock = vi.fn<(dealId: string) => Promise<PaymentRecord[]>>();
const getWireInstructionsMock = vi.fn(async (input: { dealId: string }) => ({
  routingNumber: "1",
  accountNumber: "2",
  beneficiary: "Escrow",
  bankName: "Bank",
  reference: input.dealId,
}));
vi.mock("@/services/team-14-payments", () => ({
  listPaymentsForDeal: (
    ...args: Parameters<typeof listPaymentsForDealMock>
  ) => listPaymentsForDealMock(...args),
  getWireInstructions: (
    ...args: Parameters<typeof getWireInstructionsMock>
  ) => getWireInstructionsMock(...args),
}));

import { GET } from "@/app/api/payments/wire-instructions/[dealId]/route";

const makePayment = (over: Partial<PaymentRecord>): PaymentRecord => ({
  id: "pay_1",
  userId: "u1",
  kind: "deposit",
  amount: 1000,
  currency: "USD",
  mercuryRef: "txn_1",
  status: "succeeded",
  createdAt: new Date().toISOString(),
  ...over,
});

beforeEach(() => {
  loadPrincipalMock.mockReset();
  listPaymentsForDealMock.mockReset();
  getWireInstructionsMock.mockClear();
});

const req = new Request("http://test/api/payments/wire-instructions/deal_1");

describe("GET /api/payments/wire-instructions/[dealId]", () => {
  test("401 for unauthenticated callers", async () => {
    loadPrincipalMock.mockResolvedValue(null);
    const res = await GET(req, { params: Promise.resolve({ dealId: "deal_1" }) });
    expect(res.status).toBe(401);
    expect(getWireInstructionsMock).not.toHaveBeenCalled();
  });

  test("403 when principal has no payment on the deal", async () => {
    loadPrincipalMock.mockResolvedValue({ id: "u2", roles: ["buyer"] });
    listPaymentsForDealMock.mockResolvedValue([makePayment({ userId: "u1" })]);
    const res = await GET(req, { params: Promise.resolve({ dealId: "deal_1" }) });
    expect(res.status).toBe(403);
    expect(getWireInstructionsMock).not.toHaveBeenCalled();
  });

  test("200 when principal owns a payment on the deal", async () => {
    loadPrincipalMock.mockResolvedValue({ id: "u1", roles: ["buyer"] });
    listPaymentsForDealMock.mockResolvedValue([
      makePayment({ userId: "u1", dealId: "deal_1" }),
    ]);
    const res = await GET(req, { params: Promise.resolve({ dealId: "deal_1" }) });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { wire: { reference: string } };
    expect(body.wire.reference).toBe("deal_1");
  });

  test("admins bypass the ownership check", async () => {
    loadPrincipalMock.mockResolvedValue({ id: "op", roles: ["admin"] });
    // No payments on the deal — admin should still succeed.
    listPaymentsForDealMock.mockResolvedValue([]);
    const res = await GET(req, { params: Promise.resolve({ dealId: "deal_1" }) });
    expect(res.status).toBe(200);
    expect(listPaymentsForDealMock).not.toHaveBeenCalled();
  });
});
