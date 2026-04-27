// @vitest-environment jsdom
import { describe, expect, test, vi, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import LiveScrapeProgress from "@/components/clarity/LiveScrapeProgress";

afterEach(() => {
  vi.useRealTimers();
});

describe("LiveScrapeProgress", () => {
  test("ticks the elapsed counter every second", () => {
    vi.useFakeTimers();
    render(<LiveScrapeProgress />);
    expect(screen.getByTestId("live-scrape-elapsed").textContent).toBe("0s");
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId("live-scrape-elapsed").textContent).toBe("1s");
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByTestId("live-scrape-elapsed").textContent).toBe("5s");
  });

  test("rotates the adapter label", () => {
    vi.useFakeTimers();
    render(<LiveScrapeProgress />);
    const first = screen.getByTestId("live-scrape-adapter").textContent;
    act(() => {
      vi.advanceTimersByTime(3500);
    });
    const second = screen.getByTestId("live-scrape-adapter").textContent;
    expect(second).not.toBe(first);
  });

  test("exposes role=status for screen readers", () => {
    render(<LiveScrapeProgress />);
    expect(screen.getByRole("status")).toBeTruthy();
  });
});
