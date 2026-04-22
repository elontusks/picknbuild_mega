import { describe, expect, test } from "vitest";
import { listingToInsert, rowToListing, type ListingRow } from "@/lib/listings/mappers";
import type { ListingObject } from "@/contracts";

const rowFixture: ListingRow = {
  id: "listing_0001",
  source: "craigslist",
  source_url: "https://craigslist.org/x/1",
  source_external_id: null,
  vin: null,
  year: 2019,
  make: "Honda",
  model: "Accord",
  trim: "Sport",
  mileage: 58000,
  title_status: "clean",
  price: "18500.00",
  current_bid: null,
  bin_price: null,
  estimated_market_value: null,
  fees: null,
  photos: ["https://cdn/a.jpg"],
  location_zip: "43210",
  source_updated_at: "2026-04-22T00:00:00.000Z",
  last_refreshed_at: "2026-04-22T00:00:00.000Z",
  status: "active",
  owner_user_id: null,
};

describe("rowToListing", () => {
  test("maps DB row fields into the ListingObject shape", () => {
    const l = rowToListing(rowFixture);
    expect(l.id).toBe("listing_0001");
    expect(l.sourceUrl).toBe("https://craigslist.org/x/1");
    expect(l.price).toBe(18500);
    expect(l.photos).toEqual(["https://cdn/a.jpg"]);
    expect(l.vin).toBeUndefined();
    expect(l.ownerUserId).toBeUndefined();
  });
  test("coerces numeric strings from postgres numeric columns", () => {
    const l = rowToListing({ ...rowFixture, price: "99.5", current_bid: "1234" });
    expect(l.price).toBe(99.5);
    expect(l.currentBid).toBe(1234);
  });
});

describe("listingToInsert", () => {
  test("round-trips via rowToListing", () => {
    const listing: Omit<ListingObject, "id"> = {
      source: "dealer",
      sourceUrl: "https://dealer.example.com/1",
      year: 2021,
      make: "Ford",
      model: "F-150",
      trim: "Lariat",
      mileage: 28000,
      titleStatus: "clean",
      price: 39500,
      photos: ["a", "b"],
      locationZip: "75201",
      sourceUpdatedAt: "2026-04-22T00:00:00.000Z",
      lastRefreshedAt: "2026-04-22T00:00:00.000Z",
      status: "active",
    };
    const insert = listingToInsert(listing);
    // Spot-check shape compatibility with what rowToListing expects
    const asRow: ListingRow = {
      id: "listing_test",
      source: insert.source,
      source_url: insert.source_url,
      source_external_id: insert.source_external_id ?? null,
      vin: insert.vin ?? null,
      year: listing.year,
      make: listing.make,
      model: listing.model,
      trim: insert.trim ?? null,
      mileage: insert.mileage ?? null,
      title_status: insert.title_status ?? "unknown",
      price: insert.price ?? null,
      current_bid: insert.current_bid ?? null,
      bin_price: insert.bin_price ?? null,
      estimated_market_value: insert.estimated_market_value ?? null,
      fees: insert.fees ?? null,
      photos: insert.photos ?? [],
      location_zip: insert.location_zip ?? null,
      source_updated_at: insert.source_updated_at ?? "",
      last_refreshed_at: insert.last_refreshed_at ?? "",
      status: insert.status ?? "active",
      owner_user_id: insert.owner_user_id ?? null,
    };
    const back = rowToListing(asRow);
    expect(back.make).toBe("Ford");
    expect(back.model).toBe("F-150");
    expect(back.price).toBe(39500);
    expect(back.photos).toEqual(["a", "b"]);
  });
});
