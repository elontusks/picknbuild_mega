import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Message } from "@/contracts";

const {
  store,
  putRecord,
  getRecord,
  listRecords,
  removeRecord,
  appendToList,
} = vi.hoisted(() => {
  const store = new Map<string, unknown>();
  return {
    store,
    putRecord: vi.fn(async (bucket: string, id: string, value: unknown) => {
      store.set(`${bucket}:${id}`, value);
    }),
    getRecord: vi.fn(async (bucket: string, id: string) => {
      return store.get(`${bucket}:${id}`) ?? null;
    }),
    listRecords: vi.fn(async (bucket: string) => {
      const prefix = `${bucket}:`;
      return Array.from(store.entries())
        .filter(([k]) => k.startsWith(prefix))
        .map(([, v]) => v);
    }),
    removeRecord: vi.fn(async (bucket: string, id: string) => {
      store.delete(`${bucket}:${id}`);
    }),
    // Mirrors the Postgres `secure_records_append_to_list` RPC: atomic
    // append to an array value, creating the row as `[value]` if absent.
    // The in-memory mock is trivially atomic because JS is single-threaded
    // within a microtask tick, which is what we want for correctness tests.
    appendToList: vi.fn(async (bucket: string, id: string, value: unknown) => {
      const key = `${bucket}:${id}`;
      const existing = store.get(key);
      const arr = Array.isArray(existing) ? existing.slice() : [];
      arr.push(value);
      store.set(key, arr);
    }),
  };
});

vi.mock("@/services/team-15-storage", () => ({
  putRecord,
  getRecord,
  listRecords,
  removeRecord,
  appendToList,
}));

import * as Messaging from "@/services/team-13-messaging";
import {
  __resetRealtimeForTests,
  getRealtimeClient,
} from "@/lib/messaging/realtime-client";
import { EVENTS, threadTopic } from "@/lib/messaging/topics";

beforeEach(() => {
  store.clear();
  putRecord.mockClear();
  getRecord.mockClear();
  __resetRealtimeForTests();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("messaging — threads", () => {
  test("listThreads is empty for a fresh user", async () => {
    const threads = await Messaging.listThreads("u1");
    expect(threads).toEqual([]);
  });

  test("openOrCreateThread persists and indexes on every participant", async () => {
    const thread = await Messaging.openOrCreateThread({
      participants: ["u1", "u2"],
      kind: "buyer-dealer",
      listingId: "L1",
    });
    expect(thread.id).toMatch(/^thread_/);
    expect(thread.participants).toEqual(["u1", "u2"]);

    const fromStorage = await Messaging.getThread(thread.id);
    expect(fromStorage).toEqual(thread);

    const u1 = await Messaging.listThreads("u1");
    const u2 = await Messaging.listThreads("u2");
    expect(u1).toHaveLength(1);
    expect(u2).toHaveLength(1);
    expect(u1[0]?.id).toBe(thread.id);
    expect(u2[0]?.id).toBe(thread.id);
  });

  test("openOrCreateThread dedupes by (kind, participants, listing)", async () => {
    const a = await Messaging.openOrCreateThread({
      participants: ["u1", "u2"],
      kind: "buyer-dealer",
      listingId: "L1",
    });
    const b = await Messaging.openOrCreateThread({
      participants: ["u2", "u1"], // order should not matter
      kind: "buyer-dealer",
      listingId: "L1",
    });
    expect(b.id).toBe(a.id);
    const u1 = await Messaging.listThreads("u1");
    expect(u1).toHaveLength(1);
  });

  test("different listingId opens a fresh thread", async () => {
    const a = await Messaging.openOrCreateThread({
      participants: ["u1", "u2"],
      kind: "buyer-dealer",
      listingId: "L1",
    });
    const b = await Messaging.openOrCreateThread({
      participants: ["u1", "u2"],
      kind: "buyer-dealer",
      listingId: "L2",
    });
    expect(b.id).not.toBe(a.id);
  });

  test("openOrCreateThread rejects empty participants", async () => {
    await expect(
      Messaging.openOrCreateThread({
        participants: [],
        kind: "buyer-dealer",
      }),
    ).rejects.toThrow(/participants must be non-empty/);
  });

  test("markThreadRead persists a per-user lastReadAt and advances on repeat", async () => {
    const thread = await Messaging.openOrCreateThread({
      participants: ["u1", "u2"],
      kind: "buyer-dealer",
    });
    const first = await Messaging.markThreadRead({
      userId: "u1",
      threadId: thread.id,
    });
    expect(first.ok).toBe(true);
    expect(first.lastReadAt).toBeTruthy();
    const stateA = await Messaging.getThreadReadState(thread.id);
    expect(stateA.u1).toBe(first.lastReadAt);

    // A second participant reading is additive, not overwriting.
    const second = await Messaging.markThreadRead({
      userId: "u2",
      threadId: thread.id,
    });
    const stateB = await Messaging.getThreadReadState(thread.id);
    expect(stateB.u1).toBe(first.lastReadAt);
    expect(stateB.u2).toBe(second.lastReadAt);

    // Same user re-marking advances their timestamp.
    await new Promise((r) => setTimeout(r, 5));
    const third = await Messaging.markThreadRead({
      userId: "u1",
      threadId: thread.id,
    });
    const stateC = await Messaging.getThreadReadState(thread.id);
    expect(stateC.u1).toBe(third.lastReadAt);
    expect(third.lastReadAt.localeCompare(first.lastReadAt)).toBeGreaterThan(0);
  });
});

describe("messaging — messages", () => {
  test("sendMessage persists and bumps thread.lastMessageAt", async () => {
    const thread = await Messaging.openOrCreateThread({
      participants: ["u1", "u2"],
      kind: "buyer-seller",
    });
    const before = thread.lastMessageAt;

    await new Promise((r) => setTimeout(r, 5));
    const msg = await Messaging.sendMessage({
      threadId: thread.id,
      senderId: "u1",
      body: "hi",
    });
    expect(msg.threadId).toBe(thread.id);
    expect(msg.senderId).toBe("u1");
    expect(msg.body).toBe("hi");

    const reloaded = await Messaging.getThread(thread.id);
    expect(reloaded?.lastMessageAt).toBe(msg.sentAt);
    expect(reloaded?.lastMessageAt.localeCompare(before)).toBeGreaterThanOrEqual(
      0,
    );

    const listed = await Messaging.listMessages(thread.id);
    expect(listed.map((m) => m.body)).toEqual(["hi"]);
  });

  test("listMessages paginates with limit + before", async () => {
    const thread = await Messaging.openOrCreateThread({
      participants: ["u1", "u2"],
      kind: "buyer-seller",
    });
    for (let i = 0; i < 5; i++) {
      await Messaging.sendMessage({
        threadId: thread.id,
        senderId: "u1",
        body: `m${i}`,
      });
      // Space them out so sentAt is strictly increasing.
      await new Promise((r) => setTimeout(r, 2));
    }
    const all = await Messaging.listMessages(thread.id);
    expect(all.map((m) => m.body)).toEqual(["m0", "m1", "m2", "m3", "m4"]);

    const lastTwo = await Messaging.listMessages(thread.id, { limit: 2 });
    expect(lastTwo.map((m) => m.body)).toEqual(["m3", "m4"]);

    const before = all[3]?.sentAt ?? "";
    const earlier = await Messaging.listMessages(thread.id, { before });
    expect(earlier.map((m) => m.body)).toEqual(["m0", "m1", "m2"]);
  });

  test("listMessages breaks sentAt ties by id for stable ordering", async () => {
    // Two messages with identical sentAt must land in a deterministic
    // order. Shove them directly into the bucket so we can pin the
    // timestamp exactly; sending through the service can't repro this
    // without hacking Date.
    const sentAt = "2026-04-22T00:00:00.000Z";
    const rows = [
      {
        id: "msg_b",
        threadId: "T1",
        senderId: "u1",
        body: "b",
        sentAt,
      },
      {
        id: "msg_a",
        threadId: "T1",
        senderId: "u1",
        body: "a",
        sentAt,
      },
    ];
    store.set("messages:T1", rows);
    const listed = await Messaging.listMessages("T1");
    expect(listed.map((m) => m.id)).toEqual(["msg_a", "msg_b"]);
  });
});

describe("messaging — socket transport", () => {
  test("subscribeThread receives a published message", async () => {
    const thread = await Messaging.openOrCreateThread({
      participants: ["u1", "u2"],
      kind: "buyer-picknbuild",
    });
    const received: Message[] = [];
    const handle = Messaging.subscribeThread(thread.id, (m) => {
      received.push(m);
    });
    const sent = await Messaging.sendMessage({
      threadId: thread.id,
      senderId: "u1",
      body: "socket echo",
    });
    expect(received).toHaveLength(1);
    expect(received[0]?.id).toBe(sent.id);
    handle.close();

    // After close, further publishes are not delivered.
    await Messaging.sendMessage({
      threadId: thread.id,
      senderId: "u1",
      body: "after close",
    });
    expect(received).toHaveLength(1);
  });

  test("sendMessage does not throw when realtime publish fails", async () => {
    const thread = await Messaging.openOrCreateThread({
      participants: ["u1", "u2"],
      kind: "buyer-picknbuild",
    });
    const originalPublish = getRealtimeClient().publish;
    const spy = vi
      .spyOn(getRealtimeClient(), "publish")
      .mockImplementation(async () => {
        throw new Error("transport down");
      });
    const msg = await Messaging.sendMessage({
      threadId: thread.id,
      senderId: "u1",
      body: "still persists",
    });
    expect(msg.body).toBe("still persists");
    const listed = await Messaging.listMessages(thread.id);
    expect(listed).toHaveLength(1);
    spy.mockRestore();
    // sanity: the spy restored back to the in-memory impl.
    expect(getRealtimeClient().publish).toBe(originalPublish);
  });
});

describe("messaging — topics", () => {
  test("thread topic matches the transport event format", () => {
    expect(threadTopic("t1")).toBe("thread:t1");
    expect(EVENTS.messageSent).toBe("message.sent");
  });
});

describe("messaging — appendToList adoption", () => {
  test("openOrCreateThread uses appendToList instead of read-modify-write", async () => {
    appendToList.mockClear();
    await Messaging.openOrCreateThread({
      participants: ["u1", "u2", "u3"],
      kind: "buyer-picknbuild",
    });
    // One atomic append per participant — no getRecord → push → putRecord
    // dance. Guards against regressing back to the racy RMW.
    expect(appendToList).toHaveBeenCalledTimes(3);
    expect(appendToList.mock.calls.map((c) => c[0])).toEqual([
      "threads_by_user",
      "threads_by_user",
      "threads_by_user",
    ]);
  });

  test("concurrent openOrCreateThread calls for the same user keep every thread id", async () => {
    // Fire N parallel creates. With the old RMW pattern, the last writer
    // wins and most of the ids land only on their own participant's index.
    // With appendToList each id is preserved on every participant's index.
    const userId = "u_contested";
    const peers = Array.from({ length: 10 }, (_, i) => `peer_${i}`);
    const created = await Promise.all(
      peers.map((peer) =>
        Messaging.openOrCreateThread({
          participants: [userId, peer],
          kind: "buyer-dealer",
        }),
      ),
    );
    const createdIds = new Set(created.map((t) => t.id));
    expect(createdIds.size).toBe(peers.length);

    const visible = await Messaging.listThreads(userId);
    const visibleIds = new Set(visible.map((t) => t.id));
    expect(visibleIds).toEqual(createdIds);
  });

  test("listThreads dedupes if the same id appears twice in the index", async () => {
    // Defense-in-depth: appendToList is atomic but not deduping, so a
    // replayed/retried append shouldn't render the thread twice.
    const thread = await Messaging.openOrCreateThread({
      participants: ["dup_u"],
      kind: "buyer-dealer",
    });
    // Force a duplicate in the index directly.
    await appendToList("threads_by_user", "dup_u", thread.id);
    const threads = await Messaging.listThreads("dup_u");
    expect(threads).toHaveLength(1);
    expect(threads[0]!.id).toBe(thread.id);
  });
});
