import { describe, expect, it } from "vitest";
import { makeFixtureListingObject } from "@/contracts";
import {
  isPicknbuildEligible,
  listingToCar,
} from "@/lib/search-demo/listing-to-car";

describe("listingToCar", () => {
  it("maps a dealer listing into the dealer column with low effort/risk", () => {
    const listing = makeFixtureListingObject({
      source: "dealer",
      price: 22500,
      photos: ["https://example.com/a.jpg", "https://example.com/b.jpg"],
      mileage: 22000,
      titleStatus: "clean",
    });
    const car = listingToCar(listing);
    expect(car.path).toBe("dealer");
    expect(car.effort).toBe("low");
    expect(car.risk).toBe("low");
    expect(car.totalCost).toBe(22500);
    expect(car.acv).toBe(22500);
    expect(car.image).toBe("https://example.com/a.jpg");
    expect(car.gallery).toEqual(listing.photos);
    expect(car.titleStatus).toBe("clean");
    expect(car.condition).toBe("excellent");
  });

  it("maps a copart auction listing into the auction column with high effort/risk", () => {
    const listing = makeFixtureListingObject({
      source: "copart",
      price: undefined,
      currentBid: 6500,
      titleStatus: "rebuilt",
    });
    const car = listingToCar(listing);
    expect(car.path).toBe("auction");
    expect(car.effort).toBe("high");
    expect(car.risk).toBe("high");
    expect(car.totalCost).toBe(6500);
    expect(car.condition).toBe("fair");
    expect(car.titleStatus).toBe("rebuilt");
  });

  it("maps an IAAI auction listing into the auction column", () => {
    const listing = makeFixtureListingObject({
      source: "iaai",
      price: undefined,
      currentBid: undefined,
      binPrice: 4200,
    });
    const car = listingToCar(listing);
    expect(car.path).toBe("auction");
    expect(car.totalCost).toBe(4200);
  });

  it("maps a craigslist listing into the individual column", () => {
    const listing = makeFixtureListingObject({
      source: "craigslist",
      price: 8000,
    });
    const car = listingToCar(listing);
    expect(car.path).toBe("individual");
    expect(car.effort).toBe("medium");
    expect(car.risk).toBe("medium");
  });

  it("maps a user-uploaded listing into the individual column", () => {
    const listing = makeFixtureListingObject({
      source: "user",
      price: 12500,
    });
    const car = listingToCar(listing);
    expect(car.path).toBe("individual");
  });

  it("maps a parsed-link listing into the individual column", () => {
    const listing = makeFixtureListingObject({
      source: "parsed-link",
      price: 15000,
    });
    const car = listingToCar(listing);
    expect(car.path).toBe("individual");
  });

  it("falls back to estimatedMarketValue when no other price is set", () => {
    const listing = makeFixtureListingObject({
      source: "dealer",
      price: undefined,
      currentBid: undefined,
      binPrice: undefined,
      estimatedMarketValue: 17500,
    });
    const car = listingToCar(listing);
    expect(car.totalCost).toBe(17500);
    expect(car.acv).toBe(17500);
  });

  it("uses placeholder image when listing has no photos", () => {
    const listing = makeFixtureListingObject({ photos: [] });
    const car = listingToCar(listing);
    expect(car.image).toBe("/placeholder-car.svg");
    expect(car.gallery).toBeUndefined();
  });

  it("strips unknown title status (does not pass through)", () => {
    const listing = makeFixtureListingObject({ titleStatus: "unknown" });
    const car = listingToCar(listing);
    expect(car.titleStatus).toBeUndefined();
  });

  it("maps a firecrawl listing into the dealer column", () => {
    // Firecrawl-driven adapters (Cars.com, BaT, dealer sites) feed the dealer
    // column. Before this mapping existed, firecrawl rows were silently
    // dropped because SOURCE_TO_PATH had no entry for them.
    const listing = makeFixtureListingObject({
      source: "firecrawl",
      price: 18900,
      titleStatus: "clean",
    });
    const car = listingToCar(listing);
    expect(car.path).toBe("dealer");
    expect(car.effort).toBe("low");
    expect(car.risk).toBe("low");
    expect(car.totalCost).toBe(18900);
  });
});

describe("isPicknbuildEligible", () => {
  it("includes clean-title dealer listings", () => {
    expect(
      isPicknbuildEligible(
        makeFixtureListingObject({ source: "dealer", titleStatus: "clean" }),
      ),
    ).toBe(true);
  });

  it("includes clean-title auction listings (copart, iaai)", () => {
    expect(
      isPicknbuildEligible(
        makeFixtureListingObject({ source: "copart", titleStatus: "clean" }),
      ),
    ).toBe(true);
    expect(
      isPicknbuildEligible(
        makeFixtureListingObject({ source: "iaai", titleStatus: "clean" }),
      ),
    ).toBe(true);
  });

  it("includes clean-title firecrawl listings (Cars.com et al.)", () => {
    expect(
      isPicknbuildEligible(
        makeFixtureListingObject({ source: "firecrawl", titleStatus: "clean" }),
      ),
    ).toBe(true);
  });

  it("excludes rebuilt-title listings even from dealer/auction", () => {
    expect(
      isPicknbuildEligible(
        makeFixtureListingObject({ source: "dealer", titleStatus: "rebuilt" }),
      ),
    ).toBe(false);
    expect(
      isPicknbuildEligible(
        makeFixtureListingObject({ source: "copart", titleStatus: "rebuilt" }),
      ),
    ).toBe(false);
  });

  it("excludes individual-source listings even when clean", () => {
    expect(
      isPicknbuildEligible(
        makeFixtureListingObject({ source: "craigslist", titleStatus: "clean" }),
      ),
    ).toBe(false);
    expect(
      isPicknbuildEligible(
        makeFixtureListingObject({ source: "user", titleStatus: "clean" }),
      ),
    ).toBe(false);
    expect(
      isPicknbuildEligible(
        makeFixtureListingObject({ source: "parsed-link", titleStatus: "clean" }),
      ),
    ).toBe(false);
  });

  it("excludes unknown-title listings", () => {
    expect(
      isPicknbuildEligible(
        makeFixtureListingObject({ source: "dealer", titleStatus: "unknown" }),
      ),
    ).toBe(false);
  });
});
