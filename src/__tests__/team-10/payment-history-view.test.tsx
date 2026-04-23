// @vitest-environment jsdom
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeFixturePaymentRecord } from "@/contracts";
import { PaymentHistoryView } from "@/components/dashboard/payment-history-view";

describe("PaymentHistoryView", () => {
  test("renders refunds and balance payments alongside the deposit", () => {
    render(
      <PaymentHistoryView
        payments={[
          makeFixturePaymentRecord({
            id: "p_deposit",
            kind: "deposit",
            amount: 1000,
            createdAt: "2026-01-01T00:00:00.000Z",
          }),
          makeFixturePaymentRecord({
            id: "p_balance",
            kind: "balance",
            amount: 20000,
            createdAt: "2026-03-01T00:00:00.000Z",
          }),
          makeFixturePaymentRecord({
            id: "p_refund",
            kind: "refund",
            amount: 500,
            status: "refunded",
            createdAt: "2026-02-01T00:00:00.000Z",
          }),
        ]}
      />,
    );
    const rows = screen.getAllByTestId("payment-history-row");
    expect(rows.map((r) => r.dataset["kind"])).toEqual([
      "balance",
      "refund",
      "deposit",
    ]);
  });

  test("shows an empty state when there are no payments", () => {
    render(<PaymentHistoryView payments={[]} />);
    expect(screen.getByTestId("payment-history-empty")).toBeTruthy();
  });
});
