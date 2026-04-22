import { describe, expect, test } from "vitest";
import {
  decodeVinMake,
  decodeVinYear,
  lookupVin,
} from "@/lib/listings/vin-lookup";

describe("decodeVinYear", () => {
  test("decodes year codes via position 10", () => {
    // 10th char 'L' → 2020
    expect(decodeVinYear("1HGCV1F30LA012345")).toBe(2020);
    // 10th char 'H' → 2017
    expect(decodeVinYear("5YJSA1E26HF012346")).toBe(2017);
  });
  test("returns undefined for invalid VINs", () => {
    expect(decodeVinYear("not-a-vin")).toBeUndefined();
  });
});

describe("decodeVinMake", () => {
  test("decodes known WMIs", () => {
    expect(decodeVinMake("1HGCV1F30LA012345")).toEqual({
      make: "Honda",
      model: "Accord",
    });
    expect(decodeVinMake("5YJSA1E26HF012346")).toEqual({
      make: "Tesla",
      model: "Model S",
    });
  });
  test("unknown WMIs return undefined", () => {
    expect(decodeVinMake("ZZZCV1F30LA012345")).toBeUndefined();
  });
});

describe("lookupVin", () => {
  test("returns the full result for a known VIN", () => {
    const r = lookupVin("1HGCV1F30LA012345");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.result).toEqual({
        vin: "1HGCV1F30LA012345",
        year: 2020,
        make: "Honda",
        model: "Accord",
      });
    }
  });
  test("invalid VIN returns invalid-vin", () => {
    expect(lookupVin("bad")).toEqual({ ok: false, reason: "invalid-vin" });
  });
  test("unknown-but-valid VIN returns not-found", () => {
    const r = lookupVin("ZZZZZZZZZZLA12345");
    expect(r).toEqual({ ok: false, reason: "not-found" });
  });
});
