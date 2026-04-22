// @vitest-environment jsdom
import { describe, expect, test } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import {
  makeFixturePathQuote,
  makeFixtureUser,
  type IntakeState,
  type PathQuote,
} from "@/contracts";
import { IntakeProvider } from "@/lib/intake";
import { YourBestPathRightNow } from "@/components/decision/your-best-path";

const memoryPersistence = () => {
  const store = new Map<string, IntakeState>();
  return {
    load: (id: string) => store.get(id) ?? null,
    save: (id: string, s: IntakeState) => {
      store.set(id, s);
    },
  };
};

const renderWithIntake = (quotes: PathQuote[], budget = 5000) => {
  const user = makeFixtureUser({ budget, creditScore: 680 });
  return render(
    <IntakeProvider user={user} persistence={memoryPersistence()}>
      <YourBestPathRightNow quotes={quotes} bestFit="lowestTotal" />
    </IntakeProvider>,
  );
};

describe("YourBestPathRightNow", () => {
  test("empty quotes → empty prompt (no recommend call)", () => {
    renderWithIntake([]);
    expect(screen.getByTestId("your-best-path-empty")).toBeTruthy();
  });

  test("picks the lowest-total *eligible* path under lowestTotal preference", async () => {
    // cash=5000 so auction (13000) and private (12000) are ineligible
    // (they require > cash). Among financed paths, picknbuild has the lower
    // down ($3k fits cash, dealer $2.5k fits too) → pick lowest-total of the
    // two eligible ones: picknbuild at $20k.
    const quotes: PathQuote[] = [
      makeFixturePathQuote({
        path: "dealer",
        total: 24000,
        down: 2400,
        monthly: 460,
        apr: 0.195,
        term: "5y",
      }),
      makeFixturePathQuote({
        path: "picknbuild",
        total: 20000,
        down: 3000,
        biweekly: 150,
        term: "3y",
      }),
      makeFixturePathQuote({
        path: "auction",
        total: 13000,
        down: undefined,
      }),
      makeFixturePathQuote({
        path: "private",
        total: 12000,
        down: undefined,
      }),
    ];
    renderWithIntake(quotes, 5000);
    await waitFor(() =>
      expect(screen.getByTestId("your-best-path")).toBeTruthy(),
    );
    expect(
      screen.getByTestId("your-best-path").getAttribute("data-recommended-path"),
    ).toBe("picknbuild");
    expect(screen.getByTestId("best-path-name").textContent).toBe("picknbuild");
    expect(screen.getByTestId("best-path-cta").textContent?.length).toBeGreaterThan(
      0,
    );
  });

  test("primary CTA fires onSelectPath with the recommended path", async () => {
    const quotes: PathQuote[] = [
      makeFixturePathQuote({ path: "picknbuild", total: 18000, down: 2500 }),
    ];
    const picks: string[] = [];
    const user = makeFixtureUser({ budget: 5000 });
    render(
      <IntakeProvider user={user} persistence={memoryPersistence()}>
        <YourBestPathRightNow
          quotes={quotes}
          bestFit="lowestTotal"
          onSelectPath={(p) => picks.push(p)}
        />
      </IntakeProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("best-path-cta")).toBeTruthy(),
    );
    screen.getByTestId("best-path-cta").click();
    expect(picks).toEqual(["picknbuild"]);
  });

  test("renders alternatives line when ranked list has > 1 entry", async () => {
    const quotes: PathQuote[] = [
      makeFixturePathQuote({
        path: "picknbuild",
        total: 18000,
        down: 2500,
        biweekly: 140,
        term: "3y",
      }),
      makeFixturePathQuote({
        path: "dealer",
        total: 22000,
        down: 2200,
        monthly: 420,
        apr: 0.195,
        term: "5y",
      }),
    ];
    renderWithIntake(quotes, 5000);
    await waitFor(() =>
      expect(screen.getByTestId("your-best-path")).toBeTruthy(),
    );
    const alt = screen.queryByTestId("best-path-alternatives");
    expect(alt).toBeTruthy();
    expect(alt?.textContent).toContain("Dealer");
  });
});
