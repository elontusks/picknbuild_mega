import { beforeEach, describe, expect, test, vi } from "vitest";

// Mirrors the Postgres `value = jsonb` semantics by round-tripping through
// JSON.stringify. The real atomicity comes from the UPDATE landing on a
// locked row; here we serialize with a per-key chain so concurrent calls
// can't interleave their read-and-compare.
type Store = Map<string, unknown>;
const store: Store = new Map();
const keyLocks = new Map<string, Promise<void>>();

const rpcMock = vi.fn(
  async (
    name: string,
    args: {
      p_bucket: string;
      p_id: string;
      p_expected: unknown;
      p_next: unknown;
    },
  ) => {
    if (name !== "secure_records_compare_and_set") {
      return { data: 0, error: { message: `unknown rpc ${name}` } };
    }
    const key = `${args.p_bucket}::${args.p_id}`;
    const prev = keyLocks.get(key) ?? Promise.resolve();
    let result = 0;
    const next = prev.then(async () => {
      await Promise.resolve();
      const cur = store.get(key);
      if (JSON.stringify(cur) === JSON.stringify(args.p_expected)) {
        store.set(key, args.p_next);
        result = 1;
      } else {
        result = 0;
      }
    });
    keyLocks.set(
      key,
      next.catch(() => {}),
    );
    await next;
    return { data: result, error: null };
  },
);

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: rpcMock }),
}));

import { compareAndSetRecord } from "@/services/team-15-storage";

beforeEach(() => {
  store.clear();
  keyLocks.clear();
  rpcMock.mockClear();
});

describe("compareAndSetRecord", () => {
  test("returns true and swaps when the current value matches expected", async () => {
    store.set("deal_requests::r_1", { id: "r_1", status: "submitted" });
    const ok = await compareAndSetRecord(
      "deal_requests",
      "r_1",
      { id: "r_1", status: "submitted" },
      { id: "r_1", status: "acknowledged" },
    );
    expect(ok).toBe(true);
    expect(store.get("deal_requests::r_1")).toEqual({
      id: "r_1",
      status: "acknowledged",
    });
  });

  test("returns false and leaves the row alone when current diverges", async () => {
    store.set("deal_requests::r_1", { id: "r_1", status: "acknowledged" });
    const ok = await compareAndSetRecord(
      "deal_requests",
      "r_1",
      { id: "r_1", status: "submitted" },
      { id: "r_1", status: "resolved" },
    );
    expect(ok).toBe(false);
    expect(store.get("deal_requests::r_1")).toEqual({
      id: "r_1",
      status: "acknowledged",
    });
  });

  test("two concurrent CAS calls: exactly one wins", async () => {
    type Row = { id: string; status: string; actor?: string };
    const original: Row = { id: "r_1", status: "submitted" };
    store.set("deal_requests::r_1", original);
    const [a, b] = await Promise.all([
      compareAndSetRecord<Row>("deal_requests", "r_1", original, {
        ...original,
        status: "acknowledged",
        actor: "admin_A",
      }),
      compareAndSetRecord<Row>("deal_requests", "r_1", original, {
        ...original,
        status: "acknowledged",
        actor: "admin_B",
      }),
    ]);
    // One true, one false — whichever admin got there first.
    expect([a, b].filter(Boolean)).toHaveLength(1);
  });

  test("throws when the RPC errors", async () => {
    rpcMock.mockResolvedValueOnce({
      data: 0,
      error: { message: "db down" },
    });
    await expect(
      compareAndSetRecord("b", "id", { a: 1 }, { a: 2 }),
    ).rejects.toThrow(/db down/);
  });
});
