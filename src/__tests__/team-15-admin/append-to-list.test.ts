import { beforeEach, describe, expect, test, vi } from "vitest";

// Simulated atomic list: the real implementation is a single ON CONFLICT
// statement inside Postgres. Here we mirror the semantics in JS by
// synchronously reading the current array, pushing the new value, and
// writing it back — with the whole operation happening inside a single
// awaited `rpc` call so nothing interleaves. That is exactly what the SQL
// function gives us: row-level lock held for the length of the
// INSERT...ON CONFLICT DO UPDATE. If either claim breaks, concurrent calls
// would drop ids — which is the race we're fixing.

type Store = Map<string, unknown[]>;
const store: Store = new Map();

// Per-(bucket, id) mutex chain. The real RPC's atomicity comes from the
// Postgres row lock held across the INSERT...ON CONFLICT DO UPDATE —
// concurrent calls serialize on the conflict row. We model the same
// property by chaining each rpc call onto the previous one for the same
// key, so the read-modify-write cannot interleave across calls.
const keyLocks = new Map<string, Promise<void>>();

const rpcMock = vi.fn(
  async (
    name: string,
    args: { p_bucket: string; p_id: string; p_value: unknown },
  ) => {
    if (name !== "secure_records_append_to_list") {
      return { error: { message: `unknown rpc ${name}` } };
    }
    const key = `${args.p_bucket}::${args.p_id}`;
    const prev = keyLocks.get(key) ?? Promise.resolve();
    const next = prev.then(async () => {
      const cur = store.get(key) ?? [];
      // Simulate a network roundtrip mid-operation; with the mutex the
      // read/write still can't interleave.
      await Promise.resolve();
      store.set(key, [...cur, args.p_value]);
    });
    keyLocks.set(
      key,
      next.catch(() => {}),
    );
    await next;
    return { error: null };
  },
);

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: rpcMock }),
}));

import { appendToList } from "@/services/team-15-storage";

beforeEach(() => {
  store.clear();
  keyLocks.clear();
  rpcMock.mockClear();
});

describe("appendToList", () => {
  test("appends a single value under (bucket, id)", async () => {
    await appendToList("threads_by_user", "u_1", "thread_a");
    expect(store.get("threads_by_user::u_1")).toEqual(["thread_a"]);
    expect(rpcMock).toHaveBeenCalledWith("secure_records_append_to_list", {
      p_bucket: "threads_by_user",
      p_id: "u_1",
      p_value: "thread_a",
    });
  });

  test("concurrent calls to the same id do not drop values", async () => {
    const ids = Array.from({ length: 20 }, (_, i) => `n_${i}`);
    // Fire every append in parallel — the race that made Team 13 switch to
    // this primitive. If our semantics are right, all 20 land.
    await Promise.all(
      ids.map((id) => appendToList("notifications_by_user", "u_1", id)),
    );
    const final = store.get("notifications_by_user::u_1") as string[];
    expect(new Set(final)).toEqual(new Set(ids));
    expect(final).toHaveLength(ids.length);
  });

  test("throws when the RPC errors", async () => {
    rpcMock.mockResolvedValueOnce({ error: { message: "db down" } });
    await expect(
      appendToList("threads_by_user", "u_1", "x"),
    ).rejects.toThrow(/db down/);
  });
});
