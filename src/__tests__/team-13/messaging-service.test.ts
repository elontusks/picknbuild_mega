import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Message } from "@/contracts";

const { store, putRecord, getRecord, listRecords, removeRecord } = vi.hoisted(
  () => {
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
    };
  },
);

vi.mock("@/services/team-15-storage", () => ({
  putRecord,
  getRecord,
  listRecords,
  removeRecord,
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
