import { describe, expect, test } from "vitest";
import { shouldRefresh, REFRESH_COOLDOWN_MS } from "@/lib/listings/refresh";

const iso = (d: Date) => d.toISOString();

describe("shouldRefresh — cooldown per source", () => {
  const now = new Date("2026-04-22T12:00:00Z");

  test("copart refreshes if last refresh > 1 hour ago", () => {
    const last = new Date(now.getTime() - 61 * 60 * 1000);
    const d = shouldRefresh("copart", iso(last), now);
    expect(d.refresh).toBe(true);
  });

  test("copart does not refresh within 1 hour", () => {
    const last = new Date(now.getTime() - 30 * 60 * 1000);
    const d = shouldRefresh("copart", iso(last), now);
    expect(d.refresh).toBe(false);
    if (!d.refresh) expect(d.reason).toBe("within-cooldown");
  });

  test("iaai uses the same 1-hour window as copart", () => {
    const last = new Date(now.getTime() - 59 * 60 * 1000);
    expect(shouldRefresh("iaai", iso(last), now).refresh).toBe(false);
  });

  test("craigslist uses a 24-hour window", () => {
    const recent = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    const stale = new Date(now.getTime() - 25 * 60 * 60 * 1000);
    expect(shouldRefresh("craigslist", iso(recent), now).refresh).toBe(false);
    expect(shouldRefresh("craigslist", iso(stale), now).refresh).toBe(true);
  });

  test.each(["dealer", "user", "parsed-link"] as const)(
    "%s never auto-refreshes",
    (source) => {
      const ancient = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      const d = shouldRefresh(source, iso(ancient), now);
      expect(d.refresh).toBe(false);
      if (!d.refresh) expect(d.reason).toBe("no-refresh-for-source");
    },
  );

  test("REFRESH_COOLDOWN_MS matches ARCHITECTURE §2 (auction 1h, craigslist 24h, firecrawl 1h)", () => {
    expect(REFRESH_COOLDOWN_MS.copart).toBe(60 * 60 * 1000);
    expect(REFRESH_COOLDOWN_MS.iaai).toBe(60 * 60 * 1000);
    expect(REFRESH_COOLDOWN_MS.craigslist).toBe(24 * 60 * 60 * 1000);
    expect(REFRESH_COOLDOWN_MS.dealer).toBeNull();
    expect(REFRESH_COOLDOWN_MS.firecrawl).toBe(60 * 60 * 1000);
  });
});
