import { describe, expect, test } from "vitest";
import {
  makeFixtureIntakeState,
  makeFixtureListingObject,
} from "@/contracts";
import {
  explainMatch,
  matchListings,
  scoreListingForIntake,
} from "@/lib/pricing/match-mode";

describe("scoreListingForIntake", () => {
  test("disqualifies listings whose title doesn't match preference", () => {
    const intake = makeFixtureIntakeState({ titlePreference: "clean" });
    const listing = makeFixtureListingObject({ titleStatus: "rebuilt" });
    const score = scoreListingForIntake(listing, intake);
    expect(score.disqualifiers.length).toBeGreaterThan(0);
  });

  test("rewards exact title match", () => {
    const intake = makeFixtureIntakeState({ titlePreference: "clean" });
    const listing = makeFixtureListingObject({ titleStatus: "clean" });
    const score = scoreListingForIntake(listing, intake);
    expect(score.reasons.join(" ")).toMatch(/clean preference/i);
  });

  test("disqualifies when picknbuild down exceeds cash", () => {
    const intake = makeFixtureIntakeState({
      cash: 500,
      creditScore: 600,
      titlePreference: "both",
    });
    const listing = makeFixtureListingObject({ price: 20000 });
    const score = scoreListingForIntake(listing, intake);
    expect(
      score.disqualifiers.some((d) => d.includes("exceeds cash")),
    ).toBe(true);
  });

  test("disqualifies when mileage exceeds cap", () => {
    const intake = makeFixtureIntakeState({ mileageMax: 50000 });
    const listing = makeFixtureListingObject({ mileage: 120000 });
    const score = scoreListingForIntake(listing, intake);
    expect(score.disqualifiers.some((d) => /Mileage/.test(d))).toBe(true);
  });

  test("ignores inactive listings", () => {
    const intake = makeFixtureIntakeState();
    const listing = makeFixtureListingObject({ status: "stale" });
    const score = scoreListingForIntake(listing, intake);
    expect(score.disqualifiers).toContain("Listing is not active.");
  });
});

describe("matchListings", () => {
  test("returns empty when matchMode is off", () => {
    // Note: matchListings still returns input listings when matchMode is off (untouched)
    const intake = makeFixtureIntakeState({ matchMode: false });
    const listings = [makeFixtureListingObject()];
    expect(matchListings(listings, intake)).toEqual(listings);
  });

  test("filters out disqualified listings when matchMode on", () => {
    const intake = makeFixtureIntakeState({
      matchMode: true,
      cash: 10000,
      titlePreference: "clean",
    });
    const listings = [
      makeFixtureListingObject({ id: "A", titleStatus: "clean", price: 12000 }),
      makeFixtureListingObject({ id: "B", titleStatus: "rebuilt", price: 12000 }),
    ];
    const result = matchListings(listings, intake);
    expect(result.map((l) => l.id)).toEqual(["A"]);
  });

  test("sorts higher-scoring listings first", () => {
    const intake = makeFixtureIntakeState({
      matchMode: true,
      cash: 30000,
      titlePreference: "clean",
      make: "Honda",
      model: "Accord",
      yearRange: [2018, 2022],
    });
    const listings = [
      makeFixtureListingObject({
        id: "A",
        make: "Honda",
        model: "Accord",
        year: 2020,
        titleStatus: "clean",
        price: 18000,
      }),
      makeFixtureListingObject({
        id: "B",
        make: "Toyota",
        model: "Camry",
        year: 2020,
        titleStatus: "clean",
        price: 18000,
      }),
    ];
    const [first] = matchListings(listings, intake);
    expect(first?.id).toBe("A");
  });
});

describe("explainMatch", () => {
  test("surfaces both reasons and disqualifiers", () => {
    const intake = makeFixtureIntakeState({
      titlePreference: "clean",
      mileageMax: 60000,
    });
    const listing = makeFixtureListingObject({
      titleStatus: "clean",
      mileage: 100000,
    });
    const explained = explainMatch(listing, intake);
    expect(explained.reasons.length).toBeGreaterThan(0);
    expect(explained.disqualifiers.length).toBeGreaterThan(0);
  });
});
