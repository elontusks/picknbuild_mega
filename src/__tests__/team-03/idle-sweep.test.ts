import { describe, expect, test } from "vitest";
import {
  classifyIdleSweep,
  nextStatusForIdle,
  REMOVED_THRESHOLD_MS,
  STALE_THRESHOLD_MS,
} from "@/lib/listings/idle-sweep";

const iso = (d: Date) => d.toISOString();

describe("nextStatusForIdle", () => {
  const now = new Date("2026-04-22T12:00:00Z");

  test("fresh rows stay active", () => {
    const last = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    expect(nextStatusForIdle("active", iso(last), now)).toBe("active");
  });

  test("rows past stale threshold become stale", () => {
    const last = new Date(now.getTime() - STALE_THRESHOLD_MS - 1000);
    expect(nextStatusForIdle("active", iso(last), now)).toBe("stale");
  });

  test("rows past removed threshold become removed", () => {
    const last = new Date(now.getTime() - REMOVED_THRESHOLD_MS - 1000);
    expect(nextStatusForIdle("active", iso(last), now)).toBe("removed");
    expect(nextStatusForIdle("stale", iso(last), now)).toBe("removed");
  });

  test("already-removed rows are not reactivated", () => {
    const last = new Date(now.getTime() - 1000);
    expect(nextStatusForIdle("removed", iso(last), now)).toBe("removed");
  });
});

describe("classifyIdleSweep", () => {
  const now = new Date("2026-04-22T12:00:00Z");

  test("only returns rows whose status should change", () => {
    const changes = classifyIdleSweep(
      [
        {
          id: "fresh",
          status: "active",
          lastRefreshedAt: iso(new Date(now.getTime() - 60 * 1000)),
        },
        {
          id: "goingStale",
          status: "active",
          lastRefreshedAt: iso(new Date(now.getTime() - STALE_THRESHOLD_MS - 1000)),
        },
        {
          id: "alreadyStale",
          status: "stale",
          lastRefreshedAt: iso(new Date(now.getTime() - STALE_THRESHOLD_MS - 1000)),
        },
      ],
      now,
    );
    expect(changes).toEqual([{ id: "goingStale", from: "active", to: "stale" }]);
  });
});
