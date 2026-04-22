import { describe, expect, test } from "vitest";
import {
  classifyUrl,
  parseLinkUrl,
  parseManualFallback,
} from "@/lib/listings/link-parser";

describe("classifyUrl", () => {
  test("identifies Copart and IAAI auction URLs", () => {
    expect(classifyUrl("https://www.copart.com/lot/12345")).toBe("copart");
    expect(classifyUrl("https://www.iaai.com/vehicle/99")).toBe("iaai");
    expect(classifyUrl("https://iaa-auction.com/x")).toBe("iaai");
  });
  test("identifies Craigslist", () => {
    expect(classifyUrl("https://newyork.craigslist.org/cto/d/abc.html")).toBe(
      "craigslist",
    );
  });
  test("identifies our own dealer domain", () => {
    expect(classifyUrl("https://pickandbuild.example.com/dealer/x")).toBe(
      "dealer",
    );
  });
  test("falls back to parsed-link for unknown hosts", () => {
    expect(classifyUrl("https://example.com/x")).toBe("parsed-link");
  });
  test("returns null for non-URLs", () => {
    expect(classifyUrl("not a url")).toBeNull();
  });
});

describe("parseLinkUrl", () => {
  test("rejects empty input", () => {
    expect(parseLinkUrl("")).toEqual({ ok: false, reason: "URL is required" });
  });
  test("rejects malformed URLs", () => {
    expect(parseLinkUrl("not a url")).toEqual({ ok: false, reason: "Not a valid URL" });
  });
  test("returns a parsed-link skeleton with the URL preserved", () => {
    const r = parseLinkUrl("https://copart.com/lot/12345");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.listing.source).toBe("parsed-link");
      expect(r.listing.sourceUrl).toBe("https://copart.com/lot/12345");
      expect(r.detectedSource).toBe("copart");
    }
  });
});

describe("parseManualFallback", () => {
  test("returns a parsed-link listing from manual fields", () => {
    const r = parseManualFallback({
      year: 2019,
      make: "Honda",
      model: "Accord",
      price: 18000,
      titleStatus: "clean",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.listing.source).toBe("parsed-link");
      expect(r.listing.year).toBe(2019);
      expect(r.listing.titleStatus).toBe("clean");
      expect(r.listing.price).toBe(18000);
    }
  });
  test("rejects payload without year/make/model", () => {
    const r = parseManualFallback({ year: 2019, make: "", model: "Accord" });
    expect(r.ok).toBe(false);
  });
});
