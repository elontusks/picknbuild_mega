import { beforeEach, describe, expect, test, vi } from "vitest";

// Track the actual query shape (eq calls + bucket) so we can assert the
// database-side filter, not just the returned data.
type Call = { col: string; val: unknown };
const eqCalls: Call[] = [];
let rowsToReturn: Array<{ value: unknown }> = [];

const queryChain = () => {
  const api: {
    eq: (col: string, val: unknown) => typeof api;
    select: (cols: string) => typeof api;
    order: () => Promise<{ data: Array<{ value: unknown }>; error: null }>;
  } = {
    eq: (col: string, val: unknown) => {
      eqCalls.push({ col, val });
      return api;
    },
    select: () => api,
    order: async () => ({ data: rowsToReturn, error: null }),
  };
  return api;
};

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table !== "secure_records") {
        throw new Error(`unexpected table ${table}`);
      }
      return queryChain();
    },
  }),
}));

// Storage is still used by recordModerationAction (puts via putRecord).
// Stub it to a no-op; targeted tests don't need write observability.
vi.mock("@/services/team-15-storage", () => ({
  putRecord: vi.fn(async () => {}),
  getRecord: vi.fn(async () => null),
  listRecords: vi.fn(async () => []),
  removeRecord: vi.fn(async () => {}),
}));

import {
  listModerationLogForTarget,
  MODERATION_LOG_BUCKET,
} from "@/lib/admin/moderation";

beforeEach(() => {
  eqCalls.length = 0;
  rowsToReturn = [];
});

describe("listModerationLogForTarget", () => {
  test("filters in the database with bucket + jsonb path eqs, not in-memory", async () => {
    rowsToReturn = [
      {
        value: {
          id: "m_1",
          actor: "admin_1",
          targetKind: "listing",
          targetId: "l_A",
          action: "remove",
          occurredAt: "2026-04-22T10:00:00.000Z",
        },
      },
    ];

    const out = await listModerationLogForTarget("listing", "l_A");

    // Three eq calls: bucket, targetKind path, targetId path. That's the
    // whole point of the fix — the earlier implementation did
    // listRecords(MODERATION_LOG_BUCKET) then .filter() in JS.
    expect(eqCalls).toEqual([
      { col: "bucket", val: MODERATION_LOG_BUCKET },
      { col: "value->>targetKind", val: "listing" },
      { col: "value->>targetId", val: "l_A" },
    ]);
    expect(out.map((r) => r.id)).toEqual(["m_1"]);
  });

  test("returns sorted entries (newest first)", async () => {
    rowsToReturn = [
      {
        value: {
          id: "m_old",
          actor: "admin_1",
          targetKind: "listing",
          targetId: "l_A",
          action: "remove",
          occurredAt: "2026-04-20T10:00:00.000Z",
        },
      },
      {
        value: {
          id: "m_new",
          actor: "admin_1",
          targetKind: "listing",
          targetId: "l_A",
          action: "mark-stale",
          occurredAt: "2026-04-22T10:00:00.000Z",
        },
      },
    ];

    const out = await listModerationLogForTarget("listing", "l_A");
    expect(out.map((r) => r.id)).toEqual(["m_new", "m_old"]);
  });
});
