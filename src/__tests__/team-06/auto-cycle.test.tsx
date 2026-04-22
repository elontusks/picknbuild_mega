// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { useAutoCycle } from "@/lib/decision";
import type { PathKind } from "@/contracts";

const PATHS: PathKind[] = ["dealer", "picknbuild", "auction", "private"];

function Harness(props: {
  initial?: PathKind;
  enabled?: boolean;
  intervalMs?: number;
}) {
  const { activePath, setActivePath, stopped } = useAutoCycle(
    PATHS,
    props.initial ?? "dealer",
    { intervalMs: props.intervalMs ?? 100, enabled: props.enabled ?? true },
  );
  return (
    <div>
      <span data-testid="active">{activePath}</span>
      <span data-testid="stopped">{stopped ? "true" : "false"}</span>
      <button
        data-testid="pick-auction"
        onClick={() => setActivePath("auction")}
      >
        pick
      </button>
    </div>
  );
}

describe("useAutoCycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test("advances through paths on each tick", () => {
    render(<Harness />);
    expect(screen.getByTestId("active").textContent).toBe("dealer");
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByTestId("active").textContent).toBe("picknbuild");
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByTestId("active").textContent).toBe("auction");
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByTestId("active").textContent).toBe("private");
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByTestId("active").textContent).toBe("dealer");
  });

  test("user selection freezes the rotation", () => {
    render(<Harness />);
    act(() => {
      screen.getByTestId("pick-auction").click();
    });
    expect(screen.getByTestId("active").textContent).toBe("auction");
    expect(screen.getByTestId("stopped").textContent).toBe("true");
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId("active").textContent).toBe("auction");
  });

  test("enabled=false disables the timer", () => {
    render(<Harness enabled={false} />);
    expect(screen.getByTestId("active").textContent).toBe("dealer");
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId("active").textContent).toBe("dealer");
  });
});
