// @vitest-environment jsdom
import { describe, expect, test } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import {
  makeFixtureListingObject,
  makeFixturePathQuote,
  makeFixtureUser,
  type IntakeState,
  type PathQuote,
} from "@/contracts";
import { IntakeProvider } from "@/lib/intake";
import { SeeWhereYouStandPanel } from "@/components/decision/see-where-you-stand";

const memoryPersistence = () => {
  const store = new Map<string, IntakeState>();
  return {
    load: (id: string) => store.get(id) ?? null,
    save: (id: string, s: IntakeState) => {
      store.set(id, s);
    },
  };
};

const fourPaths = (): PathQuote[] => [
  makeFixturePathQuote({ path: "dealer", total: 24000, barrierLine: "D" }),
  makeFixturePathQuote({ path: "picknbuild", total: 22000, barrierLine: "P" }),
  makeFixturePathQuote({ path: "auction", total: 13000, barrierLine: "A" }),
  makeFixturePathQuote({ path: "private", total: 12000, barrierLine: "V" }),
];

const renderPanel = (props: Parameters<typeof SeeWhereYouStandPanel>[0]) => {
  const user = makeFixtureUser();
  return render(
    <IntakeProvider user={user} persistence={memoryPersistence()}>
      <SeeWhereYouStandPanel {...props} />
    </IntakeProvider>,
  );
};

describe("SeeWhereYouStandPanel", () => {
  test("renders the initial path's gap module", () => {
    renderPanel({
      quotes: fourPaths(),
      initialPath: "dealer",
      autoCycle: false,
    });
    expect(screen.getByTestId("gap-module-dealer")).toBeTruthy();
    expect(screen.queryByTestId("gap-module-picknbuild")).toBeNull();
  });

  test("clicking a tab swaps the active gap module", () => {
    renderPanel({
      quotes: fourPaths(),
      initialPath: "dealer",
      autoCycle: false,
    });
    act(() => {
      fireEvent.click(screen.getByTestId("path-tab-picknbuild"));
    });
    expect(screen.getByTestId("gap-module-picknbuild")).toBeTruthy();
    expect(screen.queryByTestId("gap-module-dealer")).toBeNull();
  });

  test("empty quotes renders the empty state", () => {
    renderPanel({ quotes: [], autoCycle: false });
    expect(screen.getByTestId("see-where-you-stand-empty")).toBeTruthy();
  });

  test("only-picknbuild quote set still renders picknbuild module", () => {
    const quotes: PathQuote[] = [
      makeFixturePathQuote({ path: "picknbuild", total: 19000 }),
    ];
    renderPanel({ quotes, autoCycle: false });
    expect(screen.getByTestId("gap-module-picknbuild")).toBeTruthy();
  });

  test("user clicking a path freezes auto-cycle (stopped=true)", () => {
    renderPanel({
      quotes: fourPaths(),
      initialPath: "dealer",
      autoCycle: true,
      cycleIntervalMs: 10000,
    });
    act(() => {
      fireEvent.click(screen.getByTestId("path-tab-auction"));
    });
    expect(
      screen.getByTestId("path-toggle").getAttribute("data-auto-cycle-stopped"),
    ).toBe("true");
  });

  test("auction module pulls bid/BIN from the listing context", () => {
    const listing = makeFixtureListingObject({
      source: "copart",
      currentBid: 7000,
      binPrice: 10500,
    });
    renderPanel({
      quotes: fourPaths(),
      listing,
      initialPath: "auction",
      autoCycle: false,
    });
    const panel = screen.getByTestId("auction-breakdown");
    expect(panel.textContent).toContain("$7,000");
    expect(panel.textContent).toContain("$10,500");
  });

  test("term selector disables for cash-only paths", () => {
    renderPanel({
      quotes: fourPaths(),
      initialPath: "auction",
      autoCycle: false,
    });
    const btn = screen.getByTestId("term-3y") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);

    act(() => {
      fireEvent.click(screen.getByTestId("path-tab-picknbuild"));
    });
    expect((screen.getByTestId("term-3y") as HTMLButtonElement).disabled).toBe(
      false,
    );
  });
});
