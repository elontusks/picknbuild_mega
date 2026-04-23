import { describe, expect, test } from "vitest";
import type { PathQuote } from "@/contracts";
import {
  computeHighlights,
  isLowBarrierEntry,
} from "@/lib/garage/decision-highlights";

const q = (overrides: Partial<PathQuote> & Pick<PathQuote, "path">): PathQuote => ({
  total: 20000,
  barrierLine: "",
  titleStatus: "clean",
  ...overrides,
});

describe("computeHighlights", () => {
  test("picks the row with the lowest total across approved quotes", () => {
    const rows = [
      {
        entryId: "a",
        quotes: [q({ path: "dealer", total: 25000 }), q({ path: "picknbuild", total: 22000 })],
      },
      {
        entryId: "b",
        quotes: [q({ path: "dealer", total: 30000 }), q({ path: "picknbuild", total: 19000 })],
      },
    ];
    const { winners } = computeHighlights(rows);
    expect(winners.lowestTotalEntryId).toBe("b");
  });

  test("ignores dealer quotes where approvedBool is false when ranking totals", () => {
    const rows = [
      {
        entryId: "a",
        quotes: [
          q({ path: "dealer", total: 10000, approvedBool: false }),
          q({ path: "picknbuild", total: 22000 }),
        ],
      },
      {
        entryId: "b",
        quotes: [q({ path: "dealer", total: 18000, approvedBool: true })],
      },
    ];
    const { winners } = computeHighlights(rows);
    expect(winners.lowestTotalEntryId).toBe("b");
  });

  test("picks the row with the lowest monthly-equivalent cadence", () => {
    const rows = [
      {
        entryId: "a",
        quotes: [q({ path: "dealer", monthly: 420 })],
      },
      {
        entryId: "b",
        quotes: [q({ path: "picknbuild", biweekly: 150 })],
      },
    ];
    // picknbuild 150 * 26 / 12 = 325 < 420 → b wins.
    const { winners } = computeHighlights(rows);
    expect(winners.lowestMonthlyEntryId).toBe("b");
  });

  test("returns undefined winners when no quotes qualify", () => {
    const rows = [
      {
        entryId: "a",
        quotes: [q({ path: "dealer", approvedBool: false })],
      },
    ];
    const { winners } = computeHighlights(rows);
    expect(winners.lowestTotalEntryId).toBeUndefined();
    expect(winners.lowestMonthlyEntryId).toBeUndefined();
  });
});

describe("isLowBarrierEntry", () => {
  test("returns true when any non-auction path needs ≤ $2k down", () => {
    expect(
      isLowBarrierEntry([q({ path: "private", down: 1500 })]),
    ).toBe(true);
  });

  test("ignores denied dealer rows", () => {
    expect(
      isLowBarrierEntry([q({ path: "dealer", down: 500, approvedBool: false })]),
    ).toBe(false);
  });

  test("returns false when all paths require more than $2k", () => {
    expect(
      isLowBarrierEntry([q({ path: "picknbuild", down: 3500 })]),
    ).toBe(false);
  });
});
