import { describe, expect, test } from "vitest";
import {
  makeFixtureIntakeState,
  makeFixtureListingObject,
} from "@/contracts";
import {
  quoteAllPathsForListing,
  quotePathForListing,
} from "@/lib/pricing/all-paths";

describe("quotePathForListing", () => {
  test("picknbuild quote uses credit-tier down % and term cadence", () => {
    const intake = makeFixtureIntakeState({ creditScore: 700, selectedTerm: "3y" });
    const listing = makeFixtureListingObject({ price: 20000 });
    const q = quotePathForListing("picknbuild", listing, intake);
    expect(q.path).toBe("picknbuild");
    expect(q.biweekly).toBeGreaterThan(0);
    expect(q.term).toBe("3y");
  });

  test("dealer quote honors approvedBool false when noCredit", () => {
    const intake = makeFixtureIntakeState({ noCredit: true });
    const listing = makeFixtureListingObject({ price: 20000 });
    const q = quotePathForListing("dealer", listing, intake);
    expect(q.approvedBool).toBe(false);
  });

  test("auction quote has no down/monthly/biweekly", () => {
    const intake = makeFixtureIntakeState();
    const listing = makeFixtureListingObject({
      currentBid: 8000,
      price: undefined,
    });
    const q = quotePathForListing("auction", listing, intake);
    expect(q.down).toBeUndefined();
    expect(q.biweekly).toBeUndefined();
    expect(q.monthly).toBeUndefined();
  });

  test("private quote is cash-only", () => {
    const intake = makeFixtureIntakeState();
    const listing = makeFixtureListingObject({ price: 12000 });
    const q = quotePathForListing("private", listing, intake);
    expect(q.down).toBeUndefined();
    expect(q.apr).toBeUndefined();
  });
});

describe("quoteAllPathsForListing", () => {
  test("returns all four paths in canonical order", () => {
    const intake = makeFixtureIntakeState();
    const listing = makeFixtureListingObject({ price: 20000, currentBid: 8000 });
    const qs = quoteAllPathsForListing(listing, intake);
    expect(qs.map((q) => q.path)).toEqual([
      "dealer",
      "auction",
      "picknbuild",
      "private",
    ]);
  });
});
