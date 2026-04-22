// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { PassPickDecisionInterface } from "@/components/garage/pass-pick-interface";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({ item: { decision: "pick" } }),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("PassPickDecisionInterface", () => {
  test("clicking Pick POSTs to the decision endpoint with the listing id and decision", async () => {
    await act(async () => {
      render(
        <PassPickDecisionInterface
          listingId="l_1"
          initialDecision={null}
        />,
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("pass-pick-pick"));
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/garage/l_1/decision",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ decision: "pick" }),
      }),
    );
    expect(screen.getByTestId("pass-pick").getAttribute("data-decision")).toBe(
      "pick",
    );
  });

  test("clicking the active decision a second time clears it back to null", async () => {
    await act(async () => {
      render(
        <PassPickDecisionInterface
          listingId="l_1"
          initialDecision="pick"
        />,
      );
    });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ item: { decision: null } }),
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("pass-pick-pick"));
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/garage/l_1/decision",
      expect.objectContaining({
        body: JSON.stringify({ decision: null }),
      }),
    );
  });

  test("server error surfaces an inline message and does not commit the flip", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "boom" }),
    });

    await act(async () => {
      render(
        <PassPickDecisionInterface
          listingId="l_1"
          initialDecision={null}
        />,
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("pass-pick-pass"));
    });

    expect(screen.getByTestId("pass-pick-error").textContent).toBe("boom");
  });
});
