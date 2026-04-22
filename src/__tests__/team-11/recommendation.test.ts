import { describe, expect, test } from "vitest";
import { makeFixtureIntakeState } from "@/contracts";
import type { PathQuote } from "@/contracts";
import { recommendBestPath } from "@/lib/pricing/recommendation";

const q = (overrides: Partial<PathQuote>): PathQuote => ({
  path: "picknbuild",
  total: 20000,
  approvedBool: true,
  barrierLine: "",
  titleStatus: "clean",
  ...overrides,
});

describe("recommendBestPath", () => {
  test("default bestFit = lowestTotal picks the cheapest approved path", () => {
    const intake = makeFixtureIntakeState({ cash: 30000 });
    const result = recommendBestPath({
      intake,
      quotes: [
        q({ path: "dealer", total: 22000, down: 2200, monthly: 400, apr: 0.12 }),
        q({ path: "auction", total: 15000 }),
        q({ path: "picknbuild", total: 18000, down: 2800, biweekly: 180 }),
        q({ path: "private", total: 12000 }),
      ],
    });
    expect(result.recommendedPath).toBe("private");
  });

  test("lowestMonthly picks on biweekly*26 or monthly*12", () => {
    const intake = makeFixtureIntakeState({ cash: 30000 });
    const result = recommendBestPath({
      intake,
      bestFit: "lowestMonthly",
      quotes: [
        q({ path: "dealer", total: 22000, down: 2200, monthly: 400, apr: 0.12 }),
        q({ path: "picknbuild", total: 18000, down: 2800, biweekly: 140 }),
      ],
    });
    // picknbuild: 140 * 26 = 3640; dealer: 400 * 12 = 4800
    expect(result.recommendedPath).toBe("picknbuild");
  });

  test("skips paths with approvedBool: false", () => {
    const intake = makeFixtureIntakeState({ cash: 30000 });
    const result = recommendBestPath({
      intake,
      quotes: [
        q({ path: "dealer", total: 10000, approvedBool: false }),
        q({ path: "picknbuild", total: 18000, down: 2800 }),
      ],
    });
    expect(result.recommendedPath).toBe("picknbuild");
  });

  test("skips paths whose down exceeds intake.cash", () => {
    const intake = makeFixtureIntakeState({ cash: 2000 });
    const result = recommendBestPath({
      intake,
      quotes: [
        q({ path: "dealer", total: 10000, down: 5000 }),
        q({ path: "picknbuild", total: 18000, down: 1500 }),
      ],
    });
    expect(result.recommendedPath).toBe("picknbuild");
  });

  test("respects titlePreference (rebuilt listings skipped when pref=clean)", () => {
    const intake = makeFixtureIntakeState({
      cash: 30000,
      titlePreference: "clean",
    });
    const result = recommendBestPath({
      intake,
      quotes: [
        q({ path: "private", total: 9000, titleStatus: "rebuilt" }),
        q({ path: "picknbuild", total: 18000, titleStatus: "clean", down: 2800 }),
      ],
    });
    expect(result.recommendedPath).toBe("picknbuild");
  });

  test("returns alternatives in ranked order", () => {
    const intake = makeFixtureIntakeState({ cash: 50000 });
    const result = recommendBestPath({
      intake,
      quotes: [
        q({ path: "dealer", total: 22000 }),
        q({ path: "auction", total: 15000 }),
        q({ path: "picknbuild", total: 18000, down: 2800 }),
        q({ path: "private", total: 12000 }),
      ],
    });
    expect(result.recommendedPath).toBe("private");
    expect(result.alternatives[0]).toBe("auction");
    expect(result.alternatives[1]).toBe("picknbuild");
    expect(result.alternatives[2]).toBe("dealer");
  });

  test("falls back to approved pool when nothing is eligible", () => {
    const intake = makeFixtureIntakeState({
      cash: 1,
      titlePreference: "clean",
    });
    const result = recommendBestPath({
      intake,
      quotes: [
        q({ path: "dealer", total: 22000, down: 5000 }),
        q({ path: "picknbuild", total: 18000, down: 3000 }),
      ],
    });
    expect(["dealer", "picknbuild"]).toContain(result.recommendedPath);
    expect(result.reason).toMatch(/lowest-barrier/i);
  });
});
