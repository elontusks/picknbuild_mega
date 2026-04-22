import { describe, expect, test } from "vitest";
import { makeFixturePathQuote } from "@/contracts";
import { pickBestFitPath } from "@/lib/compare/best-fit";

const q = (overrides: Parameters<typeof makeFixturePathQuote>[0] = {}) =>
  makeFixturePathQuote(overrides);

describe("pickBestFitPath", () => {
  test("lowestTotal picks the minimum total across approved paths", () => {
    const quotes = [
      q({ path: "dealer", total: 24000 }),
      q({ path: "auction", total: 13000 }),
      q({ path: "picknbuild", total: 22000 }),
      q({ path: "private", total: 15000 }),
    ];
    expect(pickBestFitPath(quotes, "lowestTotal")).toBe("auction");
  });

  test("lowestTotal excludes dealer when not approved", () => {
    const quotes = [
      q({ path: "dealer", total: 10000, approvedBool: false }),
      q({ path: "auction", total: 13000 }),
      q({ path: "picknbuild", total: 22000 }),
      q({ path: "private", total: 15000 }),
    ];
    expect(pickBestFitPath(quotes, "lowestTotal")).toBe("auction");
  });

  test("lowestMonthly prefers cadence; picknbuild biweekly scales to monthly-equivalent", () => {
    // dealer monthly $500 => 500
    // picknbuild biweekly $200 => 200 * 26/12 ≈ 433 -> winner
    const quotes = [
      q({ path: "dealer", total: 24000, monthly: 500 }),
      q({ path: "picknbuild", total: 22000, biweekly: 200, term: "3y" }),
      q({ path: "auction", total: 10000 }),
      q({ path: "private", total: 12000 }),
    ];
    expect(pickBestFitPath(quotes, "lowestMonthly")).toBe("picknbuild");
  });

  test("lowestMonthly falls back to total when no monthly cadence exists", () => {
    const quotes = [
      q({ path: "auction", total: 13000 }),
      q({ path: "private", total: 12000 }),
    ];
    expect(pickBestFitPath(quotes, "lowestMonthly")).toBe("private");
  });

  test("returns undefined when every path is unapproved", () => {
    const quotes = [q({ path: "dealer", approvedBool: false })];
    expect(pickBestFitPath(quotes, "lowestTotal")).toBeUndefined();
  });

  test("ties break by canonical path order (dealer < auction < picknbuild < private)", () => {
    const quotes = [
      q({ path: "private", total: 10000 }),
      q({ path: "auction", total: 10000 }),
      q({ path: "picknbuild", total: 10000, biweekly: undefined }),
      q({ path: "dealer", total: 10000 }),
    ];
    expect(pickBestFitPath(quotes, "lowestTotal")).toBe("dealer");
  });
});
