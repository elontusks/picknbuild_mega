// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { useBreakpoint } from "@/lib/responsive/use-breakpoint";

function Probe() {
  const bp = useBreakpoint();
  return <span data-testid="bp">{bp}</span>;
}

function setViewport(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
  window.dispatchEvent(new Event("resize"));
}

describe("useBreakpoint", () => {
  test("hydrates to current viewport and updates on resize", async () => {
    setViewport(1200);
    render(<Probe />);
    // Effect runs synchronously after mount in jsdom; wait one tick.
    await act(async () => {});
    expect(screen.getByTestId("bp").textContent).toBe("lg");

    await act(async () => {
      setViewport(500);
    });
    expect(screen.getByTestId("bp").textContent).toBe("sm");

    await act(async () => {
      setViewport(1400);
    });
    expect(screen.getByTestId("bp").textContent).toBe("xl");
  });
});
