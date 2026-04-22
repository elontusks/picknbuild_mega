// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ListingPriceModal } from "@/components/payments/listing-price-modal";

const originalFetch = globalThis.fetch;

beforeEach(() => {
  globalThis.fetch = vi.fn();
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("ListingPriceModal", () => {
  test("returns null when closed", () => {
    const { container } = render(
      <ListingPriceModal
        listingId="lst_1"
        open={false}
        onClose={() => {}}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  test("charges $5 listing-fee and shows the success state", async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ record: { id: "pay_1" } }), {
        status: 201,
      }),
    );
    const onCharged = vi.fn();
    render(
      <ListingPriceModal
        listingId="lst_7"
        open
        onClose={() => {}}
        onCharged={onCharged}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByTestId("payment-submit"));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/payments/listing-fee",
      expect.objectContaining({ method: "POST" }),
    );
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      listingId: "lst_7",
      paymentMethodId: "pm_card_visa",
    });
    expect(onCharged).toHaveBeenCalledWith("pay_1");
    expect(screen.getByTestId("listing-price-modal-success")).toBeTruthy();
  });

  test("close button invokes onClose", () => {
    const onClose = vi.fn();
    render(
      <ListingPriceModal listingId="lst_1" open onClose={onClose} />,
    );
    fireEvent.click(screen.getByTestId("listing-price-modal-close"));
    expect(onClose).toHaveBeenCalled();
  });
});
