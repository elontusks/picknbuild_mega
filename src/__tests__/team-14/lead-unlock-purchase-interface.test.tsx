// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { LeadUnlockPurchaseInterface } from "@/components/payments/lead-unlock-purchase-interface";

const originalFetch = globalThis.fetch;

beforeEach(() => {
  globalThis.fetch = vi.fn();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("LeadUnlockPurchaseInterface", () => {
  test("POSTs /api/payments/lead-unlock with the leadId + payment method", async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ record: { id: "pay_1" } }), {
        status: 201,
      }),
    );
    const onUnlocked = vi.fn();
    render(
      <LeadUnlockPurchaseInterface leadId="lead_42" onUnlocked={onUnlocked} />,
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("payment-submit"));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/payments/lead-unlock",
      expect.objectContaining({ method: "POST" }),
    );
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      leadId: "lead_42",
      paymentMethodId: "pm_card_visa",
    });
    expect(onUnlocked).toHaveBeenCalledWith("pay_1");
    expect(screen.getByTestId("lead-unlock-success")).toBeTruthy();
  });

  test("surfaces server errors in the PaymentProcessingInterface", async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: "dealer-only" }), { status: 403 }),
    );
    render(<LeadUnlockPurchaseInterface leadId="lead_1" />);
    await act(async () => {
      fireEvent.click(screen.getByTestId("payment-submit"));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByTestId("payment-error").textContent).toBe("dealer-only");
  });
});
