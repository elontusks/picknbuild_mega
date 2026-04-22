// @vitest-environment jsdom
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  makeFixtureListingObject,
  makeFixturePathQuote,
  makeFixtureUser,
  type IntakeState,
} from "@/contracts";
import { IntakeProvider } from "@/lib/intake";
import { DealerGapModule } from "@/components/decision/dealer-gap-module";
import { PicknbuildGapModule } from "@/components/decision/picknbuild-gap-module";
import { AuctionGapModule } from "@/components/decision/auction-gap-module";
import { PrivateGapModule } from "@/components/decision/private-gap-module";

const memoryPersistence = () => {
  const store = new Map<string, IntakeState>();
  return {
    load: (id: string) => store.get(id) ?? null,
    save: (id: string, s: IntakeState) => {
      store.set(id, s);
    },
  };
};

const withIntake = (ui: React.ReactNode, intake?: Partial<IntakeState>) => {
  const user = makeFixtureUser({
    budget: intake?.cash ?? 5000,
  });
  return (
    <IntakeProvider user={user} persistence={memoryPersistence()}>
      {ui}
    </IntakeProvider>
  );
};

describe("DealerGapModule", () => {
  test("renders down / monthly / APR / total + barrier line", () => {
    const quote = makeFixturePathQuote({
      path: "dealer",
      total: 24000,
      down: 2400,
      monthly: 480,
      apr: 0.195,
      term: "5y",
      barrierLine: "Dealer barrier X",
    });
    render(withIntake(<DealerGapModule quote={quote} />));
    const panel = screen.getByTestId("gap-module-dealer");
    expect(panel.textContent).toContain("$2,400");
    expect(panel.textContent).toContain("$480");
    expect(panel.textContent).toContain("19.5%");
    expect(panel.textContent).toContain("$24,000");
    expect(screen.getByTestId("barrier-line-dealer").textContent).toContain(
      "Dealer barrier X",
    );
  });

  test("approvedBool=false shows not-approved state instead of breakdown", () => {
    const quote = makeFixturePathQuote({
      path: "dealer",
      approvedBool: false,
      barrierLine: "No credit path",
    });
    render(withIntake(<DealerGapModule quote={quote} />));
    expect(screen.getByTestId("dealer-not-approved")).toBeTruthy();
    expect(screen.queryByTestId("dealer-breakdown")).toBeNull();
  });

  test("embeds buying power layer for the active quote", () => {
    const quote = makeFixturePathQuote({
      path: "dealer",
      total: 20000,
    });
    render(
      withIntake(<DealerGapModule quote={quote} />, { cash: 5000 }),
    );
    expect(screen.getByTestId("buying-power-layer-dealer")).toBeTruthy();
    expect(screen.getByTestId("bp-your-cash").textContent).toContain("$5,000");
    expect(screen.getByTestId("bp-outside").textContent).toContain("$15,000");
  });
});

describe("PicknbuildGapModule", () => {
  test("renders down / biweekly / total + barrier line", () => {
    const quote = makeFixturePathQuote({
      path: "picknbuild",
      total: 22000,
      down: 3300,
      biweekly: 180,
      term: "3y",
      barrierLine: "picknbuild barrier Y",
    });
    render(withIntake(<PicknbuildGapModule quote={quote} />));
    const panel = screen.getByTestId("gap-module-picknbuild");
    expect(panel.textContent).toContain("$3,300");
    expect(panel.textContent).toContain("$180");
    expect(panel.textContent).toContain("$22,000");
    expect(screen.getByTestId("barrier-line-picknbuild").textContent).toContain(
      "picknbuild barrier Y",
    );
  });

  test("cash term renders Cash-at-signing instead of biweekly", () => {
    const quote = makeFixturePathQuote({
      path: "picknbuild",
      total: 21000,
      down: 21000,
      biweekly: undefined,
      term: "cash",
    });
    render(withIntake(<PicknbuildGapModule quote={quote} />));
    expect(
      screen.getByTestId("picknbuild-breakdown").textContent,
    ).toContain("Cash at signing");
  });
});

describe("AuctionGapModule", () => {
  test("renders bid / BIN / fees / all-in from listing + quote", () => {
    const listing = makeFixtureListingObject({
      source: "copart",
      price: undefined,
      currentBid: 8000,
      binPrice: 11000,
      fees: 450,
      estimatedMarketValue: 12000,
    });
    const quote = makeFixturePathQuote({
      path: "auction",
      total: 13500,
      barrierLine: "Auction barrier Z",
    });
    render(withIntake(<AuctionGapModule quote={quote} listing={listing} />));
    const panel = screen.getByTestId("auction-breakdown");
    expect(panel.textContent).toContain("$8,000");
    expect(panel.textContent).toContain("$11,000");
    expect(panel.textContent).toContain("$450");
    expect(panel.textContent).toContain("$12,000");
    expect(panel.textContent).toContain("$13,500");
    expect(screen.getByTestId("barrier-line-auction").textContent).toContain(
      "Auction barrier Z",
    );
  });
});

describe("PrivateGapModule", () => {
  test("renders seller ask + all-in cash + barrier", () => {
    const listing = makeFixtureListingObject({
      source: "craigslist",
      price: 10000,
    });
    const quote = makeFixturePathQuote({
      path: "private",
      total: 10800,
      down: undefined,
      biweekly: undefined,
      barrierLine: "Private barrier Q",
    });
    render(withIntake(<PrivateGapModule quote={quote} listing={listing} />));
    const panel = screen.getByTestId("private-breakdown");
    expect(panel.textContent).toContain("$10,000");
    expect(panel.textContent).toContain("$10,800");
    expect(screen.getByTestId("barrier-line-private").textContent).toContain(
      "Private barrier Q",
    );
  });
});
