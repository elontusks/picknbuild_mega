import { describe, expect, test } from "vitest";
import { makeFixtureListingObject } from "@/contracts";
import {
  evaluateInspection,
  routeInspection,
} from "@/lib/pricing/inspection";

describe("routeInspection", () => {
  test("auction listings route to the auction specialist partner", () => {
    const r = routeInspection(
      makeFixtureListingObject({ source: "copart" }),
    );
    expect(r.status).toBe("pending");
    expect(r.partnerName).toMatch(/Auction Specialist/);
  });

  test("craigslist / user / parsed-link route to remote review", () => {
    for (const source of ["craigslist", "user", "parsed-link"] as const) {
      const r = routeInspection(makeFixtureListingObject({ source }));
      expect(r.status).toBe("pending");
      expect(r.partnerName).toMatch(/Remote Review/);
    }
  });

  test("dealer-posted listings are marked unavailable (dealer supplies their own report)", () => {
    const r = routeInspection(makeFixtureListingObject({ source: "dealer" }));
    expect(r.status).toBe("unavailable");
  });
});

describe("evaluateInspection", () => {
  test("no-op when status is not completed", () => {
    const r = evaluateInspection({
      listingId: "L1",
      status: "pending",
    });
    expect(r.recommendation).toBeUndefined();
  });

  test("high-severity issue → walk-away", () => {
    const r = evaluateInspection({
      listingId: "L1",
      status: "completed",
      issues: [
        { severity: "low", note: "cosmetic scratch" },
        { severity: "high", note: "frame damage" },
      ],
    });
    expect(r.recommendation).toBe("walk-away");
  });

  test("med-severity max → negotiate", () => {
    const r = evaluateInspection({
      listingId: "L1",
      status: "completed",
      issues: [
        { severity: "low", note: "small dent" },
        { severity: "med", note: "brake pads worn" },
      ],
    });
    expect(r.recommendation).toBe("negotiate");
  });

  test("only low issues → proceed", () => {
    const r = evaluateInspection({
      listingId: "L1",
      status: "completed",
      issues: [{ severity: "low", note: "small dent" }],
    });
    expect(r.recommendation).toBe("proceed");
  });

  test("no issues → proceed", () => {
    const r = evaluateInspection({
      listingId: "L1",
      status: "completed",
    });
    expect(r.recommendation).toBe("proceed");
  });
});
