import { describe, expect, test } from "vitest";
import {
  distanceBetweenZips,
  formatMiles,
  haversineMiles,
  zipCentroid,
} from "@/lib/geo/zip-distance";

describe("haversineMiles", () => {
  test("returns 0 for identical points", () => {
    const p = { lat: 40, lng: -83 };
    expect(haversineMiles(p, p)).toBe(0);
  });

  test("NYC to LA is ~2445 miles (±30 tolerance)", () => {
    const nyc = { lat: 40.7506, lng: -73.9972 };
    const la = { lat: 33.9731, lng: -118.2479 };
    const miles = haversineMiles(nyc, la);
    expect(miles).toBeGreaterThan(2400);
    expect(miles).toBeLessThan(2475);
  });

  test("is symmetric", () => {
    const a = { lat: 40.0067, lng: -83.0305 };
    const b = { lat: 41.5133, lng: -81.6803 };
    expect(haversineMiles(a, b)).toBeCloseTo(haversineMiles(b, a), 6);
  });
});

describe("distanceBetweenZips", () => {
  test("returns 0 when both ZIPs are identical", () => {
    expect(distanceBetweenZips("43210", "43210")).toBe(0);
  });

  test("returns null when either ZIP is unknown", () => {
    expect(distanceBetweenZips("00000", "43210")).toBeNull();
    expect(distanceBetweenZips("43210", "99999")).toBeNull();
    expect(distanceBetweenZips(undefined, "43210")).toBeNull();
    expect(distanceBetweenZips("43210", undefined)).toBeNull();
  });

  test("returns positive miles for known ZIPs", () => {
    const miles = distanceBetweenZips("43210", "44114"); // Columbus → Cleveland
    expect(miles).not.toBeNull();
    if (miles === null) return;
    expect(miles).toBeGreaterThan(100);
    expect(miles).toBeLessThan(200);
  });
});

describe("formatMiles", () => {
  test("null renders em-dash placeholder", () => {
    expect(formatMiles(null)).toBe("— mi");
  });

  test("zero renders <1 for nearby", () => {
    expect(formatMiles(0)).toBe("<1 mi");
  });

  test("sub-10 uses one decimal", () => {
    expect(formatMiles(2.345)).toBe("2.3 mi");
  });

  test("10+ rounds to integer", () => {
    expect(formatMiles(142.9)).toBe("143 mi");
  });
});

describe("zipCentroid", () => {
  test("returns lat/lng for a known ZIP", () => {
    const c = zipCentroid("43210");
    expect(c).not.toBeNull();
  });

  test("returns null for an unknown ZIP", () => {
    expect(zipCentroid("00000")).toBeNull();
  });
});
