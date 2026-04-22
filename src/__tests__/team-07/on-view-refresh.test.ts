import { describe, expect, test } from "vitest";
import { REFRESH_COOLDOWN_MS, shouldRefresh } from "@/lib/listings/refresh";

const iso = (d: Date) => d.toISOString();

/**
 * Vehicle Detail View calls Team 3's refreshListing on mount. The cooldown
 * decision lives in `shouldRefresh`. These tests assert the exact invariants
 * ARCHITECTURE §2 Supply refresh strategy specifies: auction 1h, craigslist
 * 24h, dealer/user/parsed-link never.
 */
describe("on-view refresh cooldown — invariants for Vehicle Detail View", () => {
  const now = new Date("2026-04-22T12:00:00Z");

  test("auction (copart/iaai) refreshes after 1 hour", () => {
    const stale = new Date(now.getTime() - 61 * 60 * 1000);
    expect(shouldRefresh("copart", iso(stale), now).refresh).toBe(true);
    expect(shouldRefresh("iaai", iso(stale), now).refresh).toBe(true);
  });

  test("auction does not refresh within 1 hour", () => {
    const warm = new Date(now.getTime() - 30 * 60 * 1000);
    const decision = shouldRefresh("copart", iso(warm), now);
    expect(decision.refresh).toBe(false);
    if (!decision.refresh) expect(decision.reason).toBe("within-cooldown");
  });

  test("craigslist refreshes after 24 hours", () => {
    const stale = new Date(now.getTime() - 25 * 60 * 60 * 1000);
    expect(shouldRefresh("craigslist", iso(stale), now).refresh).toBe(true);
  });

  test("craigslist does not refresh within 24 hours", () => {
    const warm = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const decision = shouldRefresh("craigslist", iso(warm), now);
    expect(decision.refresh).toBe(false);
    if (!decision.refresh) expect(decision.reason).toBe("within-cooldown");
  });

  test.each(["dealer", "user", "parsed-link"] as const)(
    "%s never auto-refreshes regardless of age",
    (source) => {
      const ancient = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      const decision = shouldRefresh(source, iso(ancient), now);
      expect(decision.refresh).toBe(false);
      if (!decision.refresh) {
        expect(decision.reason).toBe("no-refresh-for-source");
      }
    },
  );

  test("cooldown map matches ARCHITECTURE §2 numbers", () => {
    expect(REFRESH_COOLDOWN_MS.copart).toBe(60 * 60 * 1000);
    expect(REFRESH_COOLDOWN_MS.iaai).toBe(60 * 60 * 1000);
    expect(REFRESH_COOLDOWN_MS.craigslist).toBe(24 * 60 * 60 * 1000);
    expect(REFRESH_COOLDOWN_MS.dealer).toBeNull();
    expect(REFRESH_COOLDOWN_MS.user).toBeNull();
    expect(REFRESH_COOLDOWN_MS["parsed-link"]).toBeNull();
  });

  test("nextEligibleAt points forward in time when cooldown has not elapsed", () => {
    const warm = new Date(now.getTime() - 30 * 60 * 1000);
    const decision = shouldRefresh("copart", iso(warm), now);
    expect(decision.refresh).toBe(false);
    if (!decision.refresh && decision.reason === "within-cooldown") {
      const eligible = new Date(decision.nextEligibleAt!).getTime();
      expect(eligible).toBeGreaterThan(now.getTime());
    }
  });
});
