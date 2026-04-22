import { describe, expect, test } from "vitest";
import {
  normalizeListingPayload,
  normalizeTitle,
  normalizeVin,
  normalizeZip,
} from "@/lib/listings/normalizer";

describe("normalizeVin", () => {
  test("accepts a 17-char VIN and returns uppercase", () => {
    expect(normalizeVin("1hgcv1f30la012345")).toBe("1HGCV1F30LA012345");
  });
  test("rejects VINs containing I/O/Q", () => {
    expect(normalizeVin("1HGCV1F30LA01234O")).toBeUndefined();
    expect(normalizeVin("1HGCV1F30LA01234I")).toBeUndefined();
    expect(normalizeVin("1HGCV1F30LA01234Q")).toBeUndefined();
  });
  test("rejects VINs of the wrong length", () => {
    expect(normalizeVin("1HG")).toBeUndefined();
    expect(normalizeVin("")).toBeUndefined();
    expect(normalizeVin(null)).toBeUndefined();
  });
});

describe("normalizeTitle", () => {
  test("maps 'clean title' to clean", () => {
    expect(normalizeTitle("clean title")).toBe("clean");
    expect(normalizeTitle("Clean")).toBe("clean");
  });
  test("maps rebuilt / reconstructed to rebuilt", () => {
    expect(normalizeTitle("rebuilt")).toBe("rebuilt");
    expect(normalizeTitle("Reconstructed Title")).toBe("rebuilt");
  });
  test("salvage-only and unknowns fall through to 'unknown'", () => {
    expect(normalizeTitle("salvage")).toBe("unknown");
    expect(normalizeTitle("lemon")).toBe("unknown");
    expect(normalizeTitle("")).toBe("unknown");
    expect(normalizeTitle(null)).toBe("unknown");
  });
});

describe("normalizeZip", () => {
  test("accepts 5-digit ZIPs", () => {
    expect(normalizeZip("43210")).toBe("43210");
  });
  test("rejects 4-digit and 9-digit", () => {
    expect(normalizeZip("4321")).toBeUndefined();
    expect(normalizeZip("43210-1234")).toBeUndefined();
  });
});

describe("normalizeListingPayload", () => {
  test("normalizes a minimal valid payload", () => {
    const r = normalizeListingPayload({
      source: "craigslist",
      sourceUrl: "https://craigslist.org/x/1",
      year: 2019,
      make: "Honda",
      model: "Accord",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.listing.source).toBe("craigslist");
      expect(r.listing.year).toBe(2019);
      expect(r.listing.titleStatus).toBe("unknown");
      expect(r.listing.photos).toEqual([]);
      expect(r.listing.status).toBe("active");
      expect(typeof r.listing.lastRefreshedAt).toBe("string");
    }
  });
  test("rejects missing make/model", () => {
    const r = normalizeListingPayload({
      source: "craigslist",
      sourceUrl: "https://craigslist.org/x/1",
      year: 2019,
      make: "",
      model: "",
    });
    expect(r.ok).toBe(false);
  });
  test("rejects missing sourceUrl", () => {
    const r = normalizeListingPayload({
      source: "craigslist",
      sourceUrl: "",
      year: 2019,
      make: "Honda",
      model: "Accord",
    });
    expect(r.ok).toBe(false);
  });
  test("drops invalid VIN but keeps the rest", () => {
    const r = normalizeListingPayload({
      source: "copart",
      sourceUrl: "https://copart.com/lot/1",
      year: 2019,
      make: "Honda",
      model: "Accord",
      vin: "not-a-vin",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.listing.vin).toBeUndefined();
  });
  test("drops negative mileage/price", () => {
    const r = normalizeListingPayload({
      source: "dealer",
      sourceUrl: "https://dealer.example.com/1",
      year: 2019,
      make: "Honda",
      model: "Accord",
      mileage: -5,
      price: -1,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.listing.mileage).toBeUndefined();
      expect(r.listing.price).toBeUndefined();
    }
  });
  test("filters out empty photos", () => {
    const r = normalizeListingPayload({
      source: "dealer",
      sourceUrl: "https://dealer.example.com/1",
      year: 2019,
      make: "Honda",
      model: "Accord",
      photos: ["", "https://cdn/a.jpg", "  ", "https://cdn/b.jpg"],
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.listing.photos).toEqual(["https://cdn/a.jpg", "https://cdn/b.jpg"]);
  });
});
