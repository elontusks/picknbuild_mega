import type { ListingSource } from "@/contracts";

/**
 * Cooldowns in ms by source. Matches ARCHITECTURE §2 "Supply refresh strategy":
 * auction 1h, craigslist 24h, dealer-posted never (dealer owns the edit path).
 * user-posted and parsed-link listings are user-owned; no automatic refresh.
 * Firecrawl-driven sites (Cars.com, BaT, dealer sites) churn faster than a
 * dealer's own listings — 1h matches the auction cadence.
 */
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const REFRESH_COOLDOWN_MS: Record<ListingSource, number | null> = {
  copart: HOUR_MS,
  iaai: HOUR_MS,
  craigslist: DAY_MS,
  dealer: null,
  user: null,
  "parsed-link": null,
  firecrawl: HOUR_MS,
};

export type RefreshDecision =
  | { refresh: true; cooldownMs: number }
  | { refresh: false; reason: "no-refresh-for-source" | "within-cooldown"; nextEligibleAt?: string };

export const shouldRefresh = (
  source: ListingSource,
  lastRefreshedAt: string,
  now: Date = new Date(),
): RefreshDecision => {
  const cooldown = REFRESH_COOLDOWN_MS[source];
  if (cooldown === null) {
    return { refresh: false, reason: "no-refresh-for-source" };
  }
  const last = new Date(lastRefreshedAt).getTime();
  const age = now.getTime() - last;
  if (age < cooldown) {
    return {
      refresh: false,
      reason: "within-cooldown",
      nextEligibleAt: new Date(last + cooldown).toISOString(),
    };
  }
  return { refresh: true, cooldownMs: cooldown };
};
