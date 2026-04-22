import { describe, expect, test } from "vitest";
import { makeFixtureListingObject } from "@/contracts";
import { getPricingGuidance } from "@/lib/pricing/guidance";

describe("getPricingGuidance", () => {
  test("verdict=low when ask is materially below market anchor", () => {
    const g = getPricingGuidance({
      listing: makeFixtureListingObject({
        price: 8000,
        estimatedMarketValue: 10000,
      }),
      path: "private",
    });
    expect(g.verdict).toBe("low");
    expect(g.marketRange).toEqual([9000, 11000]);
  });

  test("verdict=high and surfaces negotiation anchor when overpriced", () => {
    const g = getPricingGuidance({
      listing: makeFixtureListingObject({
        price: 11500,
        estimatedMarketValue: 10000,
      }),
      path: "private",
    });
    expect(g.verdict).toBe("high");
    expect(g.negotiationAnchor).toBeLessThan(11500);
  });

  test("verdict=fair inside the 8% window", () => {
    const g = getPricingGuidance({
      listing: makeFixtureListingObject({
        price: 10300,
        estimatedMarketValue: 10000,
      }),
      path: "dealer",
    });
    expect(g.verdict).toBe("fair");
    expect(g.marketRange).toEqual([9000, 11000]);
  });

  test("auction path uses currentBid as the ask", () => {
    const g = getPricingGuidance({
      listing: makeFixtureListingObject({
        currentBid: 4000,
        estimatedMarketValue: 10000,
        price: undefined,
      }),
      path: "auction",
    });
    expect(g.verdict).toBe("low");
  });

  test("no anchor data = fair + fallback copy", () => {
    const g = getPricingGuidance({
      listing: makeFixtureListingObject({
        price: undefined,
        estimatedMarketValue: undefined,
        currentBid: undefined,
        binPrice: undefined,
      }),
      path: "private",
    });
    expect(g.verdict).toBe("fair");
    expect(g.marketRange).toBeUndefined();
  });

  test("rebuilt note appears in the reason line when applicable", () => {
    const g = getPricingGuidance({
      listing: makeFixtureListingObject({
        price: 9000,
        estimatedMarketValue: 10000,
        titleStatus: "rebuilt",
      }),
      path: "private",
    });
    expect(g.reasonLine.toLowerCase()).toContain("rebuilt");
  });
});
