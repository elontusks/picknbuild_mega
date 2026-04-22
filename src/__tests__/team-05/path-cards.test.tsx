// @vitest-environment jsdom
import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  makeFixtureIntakeState,
  makeFixtureListingObject,
  makeFixturePathQuote,
} from "@/contracts";
import { DealerPathCard } from "@/components/compare/path-cards/dealer-path-card";
import { AuctionPathCard } from "@/components/compare/path-cards/auction-path-card";
import { PicknbuildPathCard } from "@/components/compare/path-cards/picknbuild-path-card";
import { PrivateSellerPathCard } from "@/components/compare/path-cards/private-path-card";
import { BuildRecordProvider } from "@/lib/compare/build-record-store";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const withBuild = (node: React.ReactElement) => (
  <BuildRecordProvider userId="u1">{node}</BuildRecordProvider>
);

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("DealerPathCard", () => {
  test("renders monthly + APR + term headline when financed", () => {
    render(
      <DealerPathCard
        listing={makeFixtureListingObject({ price: 20000 })}
        intake={makeFixtureIntakeState({ creditScore: 720 })}
        quote={makeFixturePathQuote({
          path: "dealer",
          total: 24000,
          down: 2000,
          monthly: 500,
          apr: 0.195,
          term: "3y",
          barrierLine: "Dealer barrier",
        })}
      />,
    );
    const headline = screen.getByTestId("path-card-dealer-headline").textContent ?? "";
    expect(headline).toContain("$24,000");
    expect(headline).toContain("$500/mo");
    expect(headline).toContain("19.5% APR");
    expect(headline).toContain("3 yr");
    expect(
      screen.getByTestId("path-card-dealer-barrier").textContent,
    ).toBe("Dealer barrier");
  });

  test("renders 'Not approved' row when approvedBool=false and disables select", () => {
    render(
      <DealerPathCard
        listing={makeFixtureListingObject()}
        intake={makeFixtureIntakeState()}
        quote={makeFixturePathQuote({
          path: "dealer",
          approvedBool: false,
          barrierLine: "credit too low",
        })}
      />,
    );
    expect(screen.getByTestId("path-card-dealer-not-approved")).toBeTruthy();
    expect(
      (screen.getByTestId("select-path-dealer") as HTMLButtonElement).disabled,
    ).toBe(true);
  });
});

describe("AuctionPathCard", () => {
  test("surfaces current bid / BIN / market est / fees / timeline", () => {
    const listing = makeFixtureListingObject({
      source: "copart",
      currentBid: 7500,
      binPrice: 10500,
      estimatedMarketValue: 14000,
      fees: 900,
    });
    render(
      <AuctionPathCard
        listing={listing}
        intake={makeFixtureIntakeState()}
        quote={makeFixturePathQuote({
          path: "auction",
          total: 12800,
          barrierLine: "auction barrier",
        })}
      />,
    );
    const card = screen.getByTestId("path-card-auction");
    const text = card.textContent ?? "";
    expect(text).toContain("$7,500");
    expect(text).toContain("$10,500");
    expect(text).toContain("$14,000");
    expect(text).toContain("$900");
    expect(text).toContain("Copart closes bids");
    expect(
      screen.getByTestId("path-card-auction-headline").textContent,
    ).toContain("$12,800");
  });
});

describe("PicknbuildPathCard", () => {
  test("renders biweekly + term headline and barrier line", () => {
    render(
      withBuild(
        <PicknbuildPathCard
          listing={makeFixtureListingObject()}
          intake={makeFixtureIntakeState({ creditScore: 680 })}
          quote={makeFixturePathQuote({
            path: "picknbuild",
            total: 22000,
            down: 3500,
            biweekly: 185,
            term: "3y",
            barrierLine: "picknbuild barrier",
          })}
        />,
      ),
    );
    const headline = screen.getByTestId("path-card-picknbuild-headline").textContent ?? "";
    expect(headline).toContain("$22,000");
    expect(headline).toContain("$185 biweekly");
    expect(headline).toContain("3 yr");
    expect(
      screen.getByTestId("path-card-picknbuild-barrier").textContent,
    ).toBe("picknbuild barrier");
  });

  test("includes customization toggles, trade-in, and already-have-a-car sections", () => {
    render(
      withBuild(
        <PicknbuildPathCard
          listing={makeFixtureListingObject()}
          intake={makeFixtureIntakeState()}
          quote={makeFixturePathQuote({ path: "picknbuild" })}
        />,
      ),
    );
    expect(screen.getByTestId("picknbuild-customization-toggles")).toBeTruthy();
    expect(screen.getByTestId("trade-in-flow")).toBeTruthy();
    expect(screen.getByTestId("already-have-a-car-flow")).toBeTruthy();
  });

  test("customization checkbox flips state via BuildRecord reducer", () => {
    render(
      withBuild(
        <PicknbuildPathCard
          listing={makeFixtureListingObject()}
          intake={makeFixtureIntakeState()}
          quote={makeFixturePathQuote({ path: "picknbuild" })}
        />,
      ),
    );
    const wrap = screen.getByTestId("customization-wrap") as HTMLInputElement;
    expect(wrap.checked).toBe(false);
    fireEvent.click(wrap);
    expect(
      (screen.getByTestId("customization-wrap") as HTMLInputElement).checked,
    ).toBe(true);
  });
});

describe("PrivateSellerPathCard", () => {
  test("renders ask / all-in / negotiable marker for craigslist source", () => {
    const listing = makeFixtureListingObject({
      source: "craigslist",
      price: 11200,
    });
    render(
      <PrivateSellerPathCard
        listing={listing}
        intake={makeFixtureIntakeState()}
        quote={makeFixturePathQuote({
          path: "private",
          total: 12000,
          barrierLine: "private barrier",
        })}
      />,
    );
    const card = screen.getByTestId("path-card-private");
    expect(card.textContent).toContain("$11,200");
    expect(card.textContent).toContain("$12,000");
    expect(screen.getByTestId("path-card-private-negotiable")).toBeTruthy();
  });
});

describe("SelectPathButton (via Private card)", () => {
  test("POSTs to /api/conversions/decide on click and shows Selected state", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );
    render(
      <PrivateSellerPathCard
        listing={makeFixtureListingObject({ id: "lst_x" })}
        intake={makeFixtureIntakeState()}
        quote={makeFixturePathQuote({ path: "private" })}
      />,
    );
    fireEvent.click(screen.getByTestId("select-path-private"));
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/conversions/decide",
        expect.objectContaining({ method: "POST" }),
      );
    });
    await waitFor(() => {
      expect(
        screen.getByTestId("select-path-private").textContent,
      ).toContain("Selected");
    });
  });

  test("shows an error line when the API rejects", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "nope" }), { status: 400 }),
    );
    render(
      <PrivateSellerPathCard
        listing={makeFixtureListingObject({ id: "lst_y" })}
        intake={makeFixtureIntakeState()}
        quote={makeFixturePathQuote({ path: "private" })}
      />,
    );
    fireEvent.click(screen.getByTestId("select-path-private"));
    await waitFor(() => {
      expect(
        screen.getByTestId("select-path-private-error").textContent,
      ).toBe("nope");
    });
  });
});
