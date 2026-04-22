// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { DealerSubscriptionManagementPanel } from "@/components/payments/dealer-subscription-management-panel";
import type { Subscription } from "@/services/team-14-payments";

const originalFetch = globalThis.fetch;

const fakeSub = (overrides: Partial<Subscription> = {}): Subscription => ({
  id: "sub_1",
  userId: "u1",
  plan: "dealer-basic",
  status: "active",
  stripeSubscriptionId: "sub_stripe_1",
  stripeCustomerId: "cus_1",
  currentPeriodEnd: "2026-05-22T15:00:00Z",
  cancelAtPeriodEnd: false,
  amountUsd: 99,
  createdAt: "2026-04-22T00:00:00Z",
  updatedAt: "2026-04-22T00:00:00Z",
  ...overrides,
});

beforeEach(() => {
  globalThis.fetch = vi.fn();
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("DealerSubscriptionManagementPanel", () => {
  test("starts a subscription on the dealer-basic plan", async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ subscription: fakeSub() }), {
        status: 201,
      }),
    );
    render(<DealerSubscriptionManagementPanel initialSubscription={null} />);
    await act(async () => {
      fireEvent.click(screen.getByTestId("subscription-start"));
      await Promise.resolve();
      await Promise.resolve();
    });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/subscriptions");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({ plan: "dealer-basic" });
    expect(screen.getByTestId("subscription-status")).toBeTruthy();
  });

  test("cancel calls DELETE /api/subscriptions with atPeriodEnd=true", async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ subscription: fakeSub({ cancelAtPeriodEnd: true }) }),
        { status: 200 },
      ),
    );
    render(
      <DealerSubscriptionManagementPanel initialSubscription={fakeSub()} />,
    );
    await act(async () => {
      fireEvent.click(screen.getByTestId("subscription-cancel"));
      await Promise.resolve();
      await Promise.resolve();
    });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("DELETE");
    expect(JSON.parse(String(init.body))).toEqual({ atPeriodEnd: true });
  });

  test("surfaces backend errors via data-testid", async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: "boom" }), { status: 502 }),
    );
    render(<DealerSubscriptionManagementPanel initialSubscription={null} />);
    await act(async () => {
      fireEvent.click(screen.getByTestId("subscription-start"));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByTestId("subscription-panel-error").textContent).toBe(
      "boom",
    );
  });
});
