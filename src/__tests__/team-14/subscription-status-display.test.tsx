// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { SubscriptionStatusDisplay } from "@/components/payments/subscription-status-display";
import type { Subscription } from "@/services/team-14-payments";

const sub = (overrides: Partial<Subscription> = {}): Subscription => ({
  id: "sub_1",
  userId: "u1",
  plan: "dealer-basic",
  status: "active",
  currentPeriodEnd: "2026-05-22T15:00:00Z",
  amountUsd: 99,
  createdAt: "2026-04-22T00:00:00Z",
  updatedAt: "2026-04-22T00:00:00Z",
  ...overrides,
});

describe("SubscriptionStatusDisplay", () => {
  test("renders empty state when subscription is null", () => {
    render(<SubscriptionStatusDisplay subscription={null} />);
    expect(screen.getByTestId("subscription-status-empty")).toBeTruthy();
  });

  test("renders active subscription with renewal date", () => {
    render(<SubscriptionStatusDisplay subscription={sub()} />);
    expect(screen.getByTestId("subscription-status-label").textContent).toBe(
      "Active",
    );
    expect(screen.getByText(/Renews on/)).toBeTruthy();
    expect(screen.getByText("$99.00")).toBeTruthy();
  });

  test("shows 'Cancelled' when status is cancelled", () => {
    render(
      <SubscriptionStatusDisplay
        subscription={sub({ status: "cancelled" })}
      />,
    );
    expect(screen.getByTestId("subscription-status-label").textContent).toBe(
      "Cancelled",
    );
  });

  test("labels past_due and cancelled statuses", () => {
    const { rerender } = render(
      <SubscriptionStatusDisplay subscription={sub({ status: "past_due" })} />,
    );
    expect(screen.getByTestId("subscription-status-label").textContent).toBe(
      "Past due",
    );
    rerender(
      <SubscriptionStatusDisplay subscription={sub({ status: "cancelled" })} />,
    );
    expect(screen.getByTestId("subscription-status-label").textContent).toBe(
      "Cancelled",
    );
  });
});
