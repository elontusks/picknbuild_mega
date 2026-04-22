import type { ListingObject, ListingStatus } from "@/contracts";

/**
 * Idle-sweep thresholds. A listing older than STALE_THRESHOLD_MS since its
 * last refresh becomes `stale`; older than REMOVED_THRESHOLD_MS becomes
 * `removed`. Thresholds are generous because the on-view refresh is the
 * real freshness mechanism — the sweep is a backstop for rows nobody has
 * looked at.
 */
const DAY_MS = 24 * 60 * 60 * 1000;
export const STALE_THRESHOLD_MS = 7 * DAY_MS;
export const REMOVED_THRESHOLD_MS = 30 * DAY_MS;

export const nextStatusForIdle = (
  current: ListingStatus,
  lastRefreshedAt: string,
  now: Date = new Date(),
): ListingStatus => {
  if (current === "removed") return "removed";
  const age = now.getTime() - new Date(lastRefreshedAt).getTime();
  if (age >= REMOVED_THRESHOLD_MS) return "removed";
  if (age >= STALE_THRESHOLD_MS) return "stale";
  return "active";
};

export type IdleSweepChange = {
  id: string;
  from: ListingStatus;
  to: ListingStatus;
};

/**
 * Pure computation layer. Given a batch of listings and a clock, return the
 * rows whose status should change. The caller (store layer) persists the
 * updates. Separating pure from DB makes the logic trivially testable and
 * lets Team 15 run the same classifier from the admin ingestion health view.
 */
export const classifyIdleSweep = (
  listings: Pick<ListingObject, "id" | "status" | "lastRefreshedAt">[],
  now: Date = new Date(),
): IdleSweepChange[] => {
  const changes: IdleSweepChange[] = [];
  for (const l of listings) {
    const next = nextStatusForIdle(l.status, l.lastRefreshedAt, now);
    if (next !== l.status) {
      changes.push({ id: l.id, from: l.status, to: next });
    }
  }
  return changes;
};
