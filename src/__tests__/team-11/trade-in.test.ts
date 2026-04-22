import { describe, expect, test } from "vitest";
import { estimateTradeIn } from "@/lib/pricing/trade-in";

describe("estimateTradeIn", () => {
  test("returns a positive estimate for a clean young car", () => {
    const e = estimateTradeIn({
      vin: "1HGCM82633A004352",
      titleStatus: "clean",
      year: new Date().getUTCFullYear() - 2,
      mileage: 40000,
    });
    expect(e.estimatedTradeInValue).toBeGreaterThan(0);
    expect(e.titleAdjustment).toBe(0);
    expect(e.mileagePenalty).toBe(0);
  });

  test("rebuilt reduces value", () => {
    const clean = estimateTradeIn({
      vin: "X",
      titleStatus: "clean",
      year: new Date().getUTCFullYear() - 5,
      mileage: 80000,
    });
    const rebuilt = estimateTradeIn({
      vin: "X",
      titleStatus: "rebuilt",
      year: new Date().getUTCFullYear() - 5,
      mileage: 80000,
    });
    expect(rebuilt.estimatedTradeInValue).toBeLessThan(
      clean.estimatedTradeInValue,
    );
    expect(rebuilt.titleAdjustment).toBeLessThan(0);
  });

  test("high mileage incurs penalty", () => {
    const low = estimateTradeIn({
      vin: "X",
      titleStatus: "clean",
      year: new Date().getUTCFullYear() - 5,
      mileage: 50000,
    });
    const high = estimateTradeIn({
      vin: "X",
      titleStatus: "clean",
      year: new Date().getUTCFullYear() - 5,
      mileage: 200000,
    });
    expect(high.estimatedTradeInValue).toBeLessThan(low.estimatedTradeInValue);
    expect(high.mileagePenalty).toBeGreaterThan(0);
  });

  test("older cars fall to floor", () => {
    const ancient = estimateTradeIn({
      vin: "X",
      titleStatus: "clean",
      year: 1990,
    });
    expect(ancient.baseValue).toBe(1500);
  });
});
