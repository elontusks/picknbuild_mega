import { describe, expect, test } from "vitest";
import {
  resolveCreditBand,
  resolveDownPaymentPercentage,
} from "@/lib/pricing/credit-tier";

describe("resolveDownPaymentPercentage", () => {
  test("floors at 22% for No Credit", () => {
    expect(resolveDownPaymentPercentage({ noCredit: true })).toBe(0.22);
  });

  test("floors at 22% for undefined score", () => {
    expect(resolveDownPaymentPercentage({})).toBe(0.22);
  });

  test("floors at 22% for sub-600 scores", () => {
    expect(resolveDownPaymentPercentage({ creditScore: 550 })).toBe(0.22);
    expect(resolveDownPaymentPercentage({ creditScore: 599 })).toBe(0.22);
  });

  test("ceilings at 12% for 800+", () => {
    expect(resolveDownPaymentPercentage({ creditScore: 800 })).toBe(0.12);
    expect(resolveDownPaymentPercentage({ creditScore: 850 })).toBe(0.12);
  });

  test("hits every anchor exactly", () => {
    const anchors: [number, number][] = [
      [600, 0.22],
      [625, 0.21],
      [650, 0.2],
      [675, 0.18],
      [700, 0.16],
      [725, 0.14],
      [750, 0.13],
      [775, 0.125],
      [800, 0.12],
    ];
    for (const [score, pct] of anchors) {
      expect(resolveDownPaymentPercentage({ creditScore: score })).toBeCloseTo(pct, 4);
    }
  });

  test("interpolates linearly between 700 and 725", () => {
    // lo 700 → 0.16, hi 725 → 0.14. At 712.5 (midpoint) → 0.15
    expect(
      resolveDownPaymentPercentage({ creditScore: 712.5 }),
    ).toBeCloseTo(0.15, 4);
  });

  test("interpolates linearly between 650 and 675", () => {
    // lo 650 → 0.20, hi 675 → 0.18. At 660 (10/25 of the way) → 0.20 - 0.008 = 0.192
    expect(
      resolveDownPaymentPercentage({ creditScore: 660 }),
    ).toBeCloseTo(0.192, 4);
  });

  test("noCredit overrides a good score", () => {
    expect(
      resolveDownPaymentPercentage({ creditScore: 800, noCredit: true }),
    ).toBe(0.22);
  });
});

describe("resolveCreditBand", () => {
  test("locked for noCredit / missing / sub-600", () => {
    expect(resolveCreditBand({ noCredit: true })).toBe("locked");
    expect(resolveCreditBand({})).toBe("locked");
    expect(resolveCreditBand({ creditScore: 580 })).toBe("locked");
  });
  test("red for 600-649", () => {
    expect(resolveCreditBand({ creditScore: 600 })).toBe("red");
    expect(resolveCreditBand({ creditScore: 649 })).toBe("red");
  });
  test("yellow for 650-699", () => {
    expect(resolveCreditBand({ creditScore: 650 })).toBe("yellow");
    expect(resolveCreditBand({ creditScore: 699 })).toBe("yellow");
  });
  test("green for 700+", () => {
    expect(resolveCreditBand({ creditScore: 700 })).toBe("green");
    expect(resolveCreditBand({ creditScore: 820 })).toBe("green");
  });
});
