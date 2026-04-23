import { beforeEach, describe, expect, test, vi } from "vitest";

type Bucket = Map<string, unknown>;
const buckets = new Map<string, Bucket>();
const getBucket = (name: string): Bucket => {
  if (!buckets.has(name)) buckets.set(name, new Map());
  return buckets.get(name)!;
};

vi.mock("@/services/team-15-storage", () => ({
  putRecord: vi.fn(async (bucket: string, id: string, value: unknown) => {
    getBucket(bucket).set(id, value);
  }),
  getRecord: vi.fn(async (bucket: string, id: string) =>
    getBucket(bucket).get(id) ?? null,
  ),
  listRecords: vi.fn(async (bucket: string) =>
    Array.from(getBucket(bucket).values()),
  ),
  removeRecord: vi.fn(async (bucket: string, id: string) => {
    getBucket(bucket).delete(id);
  }),
}));

import {
  ADMIN_LOGS_BUCKET,
  listAdminLogs,
  logEvent,
} from "@/services/team-15-logging";

beforeEach(() => {
  for (const b of buckets.values()) b.clear();
});

describe("logEvent", () => {
  test("writes to admin_logs with actor, action, target, and an ISO timestamp", async () => {
    const entry = await logEvent({
      actor: "admin_1",
      action: "user.suspend",
      target: "u_2",
      metadata: { reason: "abuse" },
    });
    expect(entry.actor).toBe("admin_1");
    expect(entry.action).toBe("user.suspend");
    expect(entry.target).toBe("u_2");
    expect(typeof entry.createdAt).toBe("string");
    const rows = Array.from(getBucket(ADMIN_LOGS_BUCKET).values());
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      actor: "admin_1",
      action: "user.suspend",
      target: "u_2",
      metadata: { reason: "abuse" },
    });
  });

  test("omits metadata/target when not provided", async () => {
    const entry = await logEvent({
      actor: "admin_1",
      action: "ping",
    });
    expect(entry.target).toBeUndefined();
    expect(entry.metadata).toBeUndefined();
  });
});

describe("listAdminLogs", () => {
  test("returns entries newest-first", async () => {
    await logEvent({ actor: "a", action: "first" });
    // Force a microtask split so the timestamps differ reliably on fast runs.
    await new Promise((r) => setTimeout(r, 2));
    await logEvent({ actor: "a", action: "second" });

    const logs = await listAdminLogs();
    expect(logs.map((l) => l.action)).toEqual(["second", "first"]);
  });
});
