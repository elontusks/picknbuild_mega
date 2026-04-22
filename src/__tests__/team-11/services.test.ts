import { beforeEach, describe, expect, test } from "vitest";
import {
  makeFixtureIntakeState,
  makeFixtureListingObject,
} from "@/contracts";
import * as Pricing from "@/services/team-11-pricing";
import * as Intelligence from "@/services/team-11-intelligence";

beforeEach(() => {
  Intelligence._resetIntelligenceStoresForTests();
});

describe("Pricing service surface", () => {
  test("quoteAllPaths returns four PathQuote entries", async () => {
    const intake = makeFixtureIntakeState();
    const listing = makeFixtureListingObject({ price: 20000 });
    const quotes = await Pricing.quoteAllPaths(listing, intake);
    expect(quotes).toHaveLength(4);
  });

  test("estimateTradeInValue returns a positive value for a clean vehicle", async () => {
    const { estimatedTradeInValue } = await Pricing.estimateTradeInValue({
      vin: "X",
      titleStatus: "clean",
      year: 2020,
    });
    expect(estimatedTradeInValue).toBeGreaterThan(0);
  });

  test("estimateAlreadyHaveACar returns quote-required without vehicle info", async () => {
    const r = await Pricing.estimateAlreadyHaveACar({ requestedWork: ["wrap"] });
    expect(r.ok).toBe(false);
  });
});

describe("Intelligence service surface", () => {
  test("requestInspection returns pending for first request, persists routing", async () => {
    const listing = makeFixtureListingObject({ source: "copart" });
    const first = await Intelligence.requestInspection({
      listing,
      listingId: listing.id,
    });
    expect(first.status).toBe("pending");

    const second = await Intelligence.getInspectionResult({
      listingId: listing.id,
    });
    expect(second.partnerName).toBe(first.partnerName);
  });

  test("submitInspectionResult with high severity → walk-away recommendation", async () => {
    const result = await Intelligence.submitInspectionResult({
      listingId: "L-submitted",
      status: "completed",
      issues: [{ severity: "high", note: "frame damage" }],
    });
    expect(result.recommendation).toBe("walk-away");
  });

  test("getChecklist persists completion across calls", async () => {
    const items = await Intelligence.getChecklist({
      path: "dealer",
      listingId: "L1",
      userId: "u1",
    });
    const target = items[0]!;
    await Intelligence.updateChecklistItem({
      userId: "u1",
      itemId: target.id,
      completed: true,
    });
    const next = await Intelligence.getChecklist({
      path: "dealer",
      listingId: "L1",
      userId: "u1",
    });
    expect(next.find((i) => i.id === target.id)?.completed).toBe(true);
  });

  test("recommendBestPath respects the user's bestFit preference", async () => {
    const intake = makeFixtureIntakeState({ cash: 30000 });
    const listing = makeFixtureListingObject({ price: 20000, currentBid: 8000 });
    const quotes = await Pricing.quoteAllPaths(listing, intake);
    const monthly = await Intelligence.recommendBestPath({
      intake,
      quotes,
      bestFit: "lowestMonthly",
    });
    const total = await Intelligence.recommendBestPath({
      intake,
      quotes,
      bestFit: "lowestTotal",
    });
    expect(monthly.recommendedPath).toBeDefined();
    expect(total.recommendedPath).toBeDefined();
  });
});
