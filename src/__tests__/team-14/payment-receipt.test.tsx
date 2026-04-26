// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { PaymentReceipt } from "@/components/payments/payment-receipt";
import { RefundStatusDisplay } from "@/components/payments/refund-status-display";
import type { PaymentRecord } from "@/contracts";

const record = (overrides: Partial<PaymentRecord> = {}): PaymentRecord => ({
  id: "pay_1",
  userId: "u1",
  kind: "deposit",
  amount: 1000,
  currency: "USD",
  mercuryRef: "txn_abc",
  status: "succeeded",
  createdAt: "2026-04-22T15:00:00Z",
  ...overrides,
});

describe("PaymentReceipt", () => {
  test("renders amount formatted as USD and the mercury reference", () => {
    render(<PaymentReceipt payment={record()} />);
    expect(screen.getByText("$1,000.00")).toBeTruthy();
    expect(screen.getByTestId("payment-mercury-ref").textContent).toBe("txn_abc");
    expect(screen.getByTestId("payment-status").getAttribute("data-status")).toBe(
      "succeeded",
    );
  });

  test("humanizes the kind label", () => {
    render(<PaymentReceipt payment={record({ kind: "lead-unlock" })} />);
    expect(screen.getByText("Lead unlock")).toBeTruthy();
  });
});

describe("RefundStatusDisplay", () => {
  test("shows an empty state when there are no refunds", () => {
    render(<RefundStatusDisplay refunds={[]} />);
    expect(screen.getByTestId("refund-status-empty")).toBeTruthy();
  });

  test("renders each refund row with amount + status", () => {
    const refunds: PaymentRecord[] = [
      record({ id: "r1", kind: "refund", status: "refunded", amount: 250 }),
      record({ id: "r2", kind: "refund", status: "pending", amount: 100 }),
    ];
    render(<RefundStatusDisplay refunds={refunds} />);
    expect(screen.getByTestId("refund-row-r1").getAttribute("data-status")).toBe(
      "refunded",
    );
    expect(screen.getByTestId("refund-status-r2").textContent).toBe("pending");
    expect(screen.getByText("$250.00")).toBeTruthy();
    expect(screen.getByText("$100.00")).toBeTruthy();
  });
});
