import { describe, expect, test } from "vitest";
import {
  buildPicknbuildPathQuote,
  computePicknbuildPrice,
} from "@/lib/pricing/picknbuild-quote";

describe("computePicknbuildPrice", () => {
  test("applies tax + fees + customizations to the base price", () => {
    const q = computePicknbuildPrice({
      basePrice: 20000,
      tax: 1400,
      fees: 500,
      customizationsTotal: 3000,
      titleStatus: "clean",
      creditScore: 700,
      term: "3y",
    });
    // total = 20000 + 1400 + 500 + 3000 = 24900 (no trade-in)
    expect(q.total).toBe(24900);
    expect(q.downPercentage).toBeCloseTo(0.16, 4);
    expect(q.down).toBe(Math.round(24900 * 0.16));
  });

  test("subtracts trade-in before computing down", () => {
    const q = computePicknbuildPrice({
      basePrice: 20000,
      tax: 1400,
      fees: 500,
      customizationsTotal: 0,
      titleStatus: "clean",
      creditScore: 700,
      tradeInValue: 5000,
      term: "3y",
    });
    // total = 21900 - 5000 = 16900
    expect(q.total).toBe(16900);
    expect(q.down).toBe(Math.round(16900 * 0.16));
  });

  test("biweekly payment = remaining / cadence for 3y term", () => {
    const q = computePicknbuildPrice({
      basePrice: 20000,
      tax: 0,
      fees: 0,
      customizationsTotal: 0,
      titleStatus: "clean",
      creditScore: 700,
      term: "3y",
    });
    expect(q.biweekly).toBe(Math.round(q.remaining / 78));
  });

  test("cash term reports zero biweekly", () => {
    const q = computePicknbuildPrice({
      basePrice: 20000,
      tax: 0,
      fees: 0,
      titleStatus: "clean",
      creditScore: 700,
      term: "cash",
    });
    expect(q.biweekly).toBe(0);
  });

  test("rebuilt title discounts the vehicle base before tax/fees", () => {
    const clean = computePicknbuildPrice({
      basePrice: 20000,
      tax: 0,
      fees: 0,
      titleStatus: "clean",
      creditScore: 700,
      term: "3y",
    });
    const rebuilt = computePicknbuildPrice({
      basePrice: 20000,
      tax: 0,
      fees: 0,
      titleStatus: "rebuilt",
      creditScore: 700,
      term: "3y",
    });
    expect(rebuilt.total).toBeLessThan(clean.total);
  });

  test("No Credit locks down% at 22%", () => {
    const q = computePicknbuildPrice({
      basePrice: 20000,
      tax: 0,
      fees: 0,
      titleStatus: "clean",
      noCredit: true,
      term: "3y",
    });
    expect(q.downPercentage).toBe(0.22);
  });

  test("trade-in greater than subtotal floors total at zero", () => {
    const q = computePicknbuildPrice({
      basePrice: 1000,
      tax: 0,
      fees: 0,
      titleStatus: "clean",
      tradeInValue: 5000,
      creditScore: 700,
      term: "3y",
    });
    expect(q.total).toBe(0);
    expect(q.down).toBe(0);
    expect(q.remaining).toBe(0);
  });
});

describe("buildPicknbuildPathQuote", () => {
  test("always approved (no dealer gate) but flags No-Credit barrier", () => {
    const q = buildPicknbuildPathQuote({
      basePrice: 20000,
      titleStatus: "clean",
      noCredit: true,
      term: "3y",
    });
    expect(q.path).toBe("picknbuild");
    expect(q.approvedBool).toBe(true);
    expect(q.barrierLine).toMatch(/No Credit/i);
  });

  test("emits biweekly only when financed", () => {
    const financed = buildPicknbuildPathQuote({
      basePrice: 20000,
      titleStatus: "clean",
      creditScore: 700,
      term: "3y",
    });
    expect(financed.biweekly).toBeGreaterThan(0);

    const cash = buildPicknbuildPathQuote({
      basePrice: 20000,
      titleStatus: "clean",
      creditScore: 700,
      term: "cash",
    });
    expect(cash.biweekly).toBeUndefined();
  });
});
