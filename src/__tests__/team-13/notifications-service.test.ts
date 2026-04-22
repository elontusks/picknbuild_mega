import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

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

import * as Notifications from "@/services/team-13-notifications";
import {
  __resetRealtimeForTests,
  getRealtimeClient,
  setRealtimeClient,
  type RealtimeClient,
} from "@/lib/messaging/realtime-client";
import {
  setEmailClient,
  type EmailClient,
  type EmailMessage,
} from "@/lib/messaging/email-client";
import { userNotificationsTopic } from "@/lib/messaging/topics";
import type { Notification } from "@/contracts";

const makeEmailSpy = () => {
  const sent: EmailMessage[] = [];
  const client: EmailClient = {
    send: vi.fn(async (m: EmailMessage) => {
      sent.push(m);
      return {
        id: `em_${sent.length}`,
        to: m.to,
        acceptedAt: new Date().toISOString(),
      };
    }),
  };
  return { sent, client };
};

const makeRealtimeSpy = (): {
  client: RealtimeClient;
  published: Array<{ topic: string; event: string; payload: unknown }>;
} => {
  const published: Array<{
    topic: string;
    event: string;
    payload: unknown;
  }> = [];
  const client: RealtimeClient = {
    publish: vi.fn(async (input) => {
      published.push(input);
    }),
    subscribe: vi.fn(() => ({ close: () => {} })),
  };
  return { client, published };
};

beforeEach(() => {
  store.clear();
  putRecord.mockClear();
  getRecord.mockClear();
  __resetRealtimeForTests();
  setEmailClient(null);
});

afterEach(() => {
  vi.restoreAllMocks();
  setRealtimeClient(null);
  setEmailClient(null);
});

describe("notifications — preferences", () => {
  test("getPreferences returns defaults for a fresh user", async () => {
    const prefs = await Notifications.getPreferences("u1");
    expect(prefs.userId).toBe("u1");
    expect(prefs.channels["in-app"]).toBe(true);
    expect(prefs.channels.email).toBe(true);
    expect(prefs.channels.digest).toBe(false);
    expect(prefs.categories.message).toBe(true);
  });

  test("updatePreferences persists and round-trips", async () => {
    const saved = await Notifications.updatePreferences({
      userId: "u1",
      channels: { "in-app": true, email: false, digest: true },
      categories: {
        message: true,
        "price-change": false,
        "dealer-response": true,
        payment: true,
        "deal-status": true,
        system: false,
      },
      email: "buyer@example.com",
    });
    expect(saved.email).toBe("buyer@example.com");
    const reloaded = await Notifications.getPreferences("u1");
    expect(reloaded.channels.email).toBe(false);
    expect(reloaded.channels.digest).toBe(true);
    expect(reloaded.categories["price-change"]).toBe(false);
  });
});

describe("notifications — emit + fan-out", () => {
  test("persists one row per delivered channel, respects preferences", async () => {
    await Notifications.updatePreferences({
      userId: "u1",
      channels: { "in-app": true, email: true, digest: false },
      categories: {
        message: true,
        "price-change": true,
        "dealer-response": true,
        payment: true,
        "deal-status": true,
        system: true,
      },
      email: "u1@example.com",
    });
    const emailSpy = makeEmailSpy();
    setEmailClient(emailSpy.client);

    const persisted = await Notifications.emitNotification({
      userId: "u1",
      category: "payment",
      payload: { title: "Deposit succeeded", amount: 100000 },
      channels: ["in-app", "email"],
    });
    expect(persisted).toHaveLength(2);
    expect(persisted.map((p) => p.channel).sort()).toEqual(["email", "in-app"]);
    expect(emailSpy.sent).toHaveLength(1);
    expect(emailSpy.sent[0]?.to).toBe("u1@example.com");
    expect(emailSpy.sent[0]?.subject).toContain("Deposit succeeded");

    const all = await Notifications.listNotifications("u1");
    expect(all).toHaveLength(2);
  });

  test("drops a channel that preferences disabled", async () => {
    await Notifications.updatePreferences({
      userId: "u1",
      channels: { "in-app": true, email: false, digest: false },
      categories: {
        message: true,
        "price-change": true,
        "dealer-response": true,
        payment: true,
        "deal-status": true,
        system: true,
      },
      email: "u1@example.com",
    });
    const emailSpy = makeEmailSpy();
    setEmailClient(emailSpy.client);

    const persisted = await Notifications.emitNotification({
      userId: "u1",
      category: "message",
      payload: { title: "New message" },
      channels: ["in-app", "email"],
    });
    expect(persisted.map((p) => p.channel)).toEqual(["in-app"]);
    expect(emailSpy.sent).toHaveLength(0);
  });

  test("drops every channel when the category is disabled", async () => {
    await Notifications.updatePreferences({
      userId: "u1",
      channels: { "in-app": true, email: true, digest: true },
      categories: {
        message: false,
        "price-change": true,
        "dealer-response": true,
        payment: true,
        "deal-status": true,
        system: true,
      },
      email: "u1@example.com",
    });
    const persisted = await Notifications.emitNotification({
      userId: "u1",
      category: "message",
      payload: { title: "silenced" },
      channels: ["in-app", "email"],
    });
    expect(persisted).toEqual([]);
    expect(await Notifications.listNotifications("u1")).toEqual([]);
  });

  test("in-app publishes to the user's realtime topic", async () => {
    const rt = makeRealtimeSpy();
    setRealtimeClient(rt.client);

    const [persisted] = await Notifications.emitNotification({
      userId: "u1",
      category: "deal-status",
      payload: { title: "Build started" },
      channels: ["in-app"],
    });
    expect(persisted?.channel).toBe("in-app");
    expect(rt.published).toHaveLength(1);
    expect(rt.published[0]?.topic).toBe(userNotificationsTopic("u1"));
    expect((rt.published[0]?.payload as Notification).id).toBe(persisted?.id);
  });

  test("email failure does not throw or prevent in-app delivery", async () => {
    await Notifications.updatePreferences({
      userId: "u1",
      channels: { "in-app": true, email: true, digest: false },
      categories: {
        message: true,
        "price-change": true,
        "dealer-response": true,
        payment: true,
        "deal-status": true,
        system: true,
      },
      email: "u1@example.com",
    });
    setEmailClient({
      send: async () => {
        throw new Error("ESMTP down");
      },
    });
    const persisted = await Notifications.emitNotification({
      userId: "u1",
      category: "payment",
      payload: { title: "payment" },
      channels: ["in-app", "email"],
    });
    expect(persisted.map((p) => p.channel).sort()).toEqual(["email", "in-app"]);
    // Both rows persist even though email transport threw — caller is
    // fire-and-forget and must not see a rejection.
  });
});

describe("notifications — read state + counts", () => {
  test("countUnread and markAsRead", async () => {
    const [a, b] = await Notifications.emitNotification({
      userId: "u1",
      category: "message",
      payload: { title: "one" },
      channels: ["in-app", "email"],
    });
    expect(await Notifications.countUnread("u1")).toBe(2);
    await Notifications.markAsRead({
      userId: "u1",
      notificationId: a!.id,
    });
    expect(await Notifications.countUnread("u1")).toBe(1);
    const list = await Notifications.listNotifications("u1");
    const aReloaded = list.find((n) => n.id === a!.id);
    const bReloaded = list.find((n) => n.id === b!.id);
    expect(aReloaded?.readAt).toBeTruthy();
    expect(bReloaded?.readAt).toBeUndefined();
  });

  test("markAsRead refuses to touch another user's row", async () => {
    const [notif] = await Notifications.emitNotification({
      userId: "u1",
      category: "system",
      payload: { title: "hello" },
      channels: ["in-app"],
    });
    await Notifications.markAsRead({
      userId: "u2",
      notificationId: notif!.id,
    });
    const [row] = await Notifications.listNotifications("u1");
    expect(row?.readAt).toBeUndefined();
  });

  test("markAllAsRead flips every unread row", async () => {
    await Notifications.emitNotification({
      userId: "u1",
      category: "message",
      payload: { title: "one" },
      channels: ["in-app"],
    });
    await Notifications.emitNotification({
      userId: "u1",
      category: "payment",
      payload: { title: "two" },
      channels: ["in-app"],
    });
    const result = await Notifications.markAllAsRead("u1");
    expect(result.count).toBe(2);
    expect(await Notifications.countUnread("u1")).toBe(0);
  });
});

describe("notifications — digest", () => {
  test("sendDigest rolls up digest-channel rows and emails once", async () => {
    await Notifications.updatePreferences({
      userId: "u1",
      channels: { "in-app": true, email: true, digest: true },
      categories: {
        message: true,
        "price-change": true,
        "dealer-response": true,
        payment: true,
        "deal-status": true,
        system: true,
      },
      email: "u1@example.com",
    });
    const emailSpy = makeEmailSpy();
    setEmailClient(emailSpy.client);

    await Notifications.emitNotification({
      userId: "u1",
      category: "price-change",
      payload: { title: "drop 1" },
      channels: ["digest"],
    });
    await Notifications.emitNotification({
      userId: "u1",
      category: "price-change",
      payload: { title: "drop 2" },
      channels: ["digest"],
    });
    await Notifications.emitNotification({
      userId: "u1",
      category: "dealer-response",
      payload: { title: "dealer replied" },
      channels: ["digest"],
    });

    // The digest emit itself should not have sent any email yet.
    expect(emailSpy.sent).toHaveLength(0);

    const result = await Notifications.sendDigest({ userId: "u1" });
    expect(result.sent).toBe(true);
    expect(emailSpy.sent).toHaveLength(1);
    expect(emailSpy.sent[0]?.subject).toContain("3 update");
    expect(emailSpy.sent[0]?.text).toContain("price-change (2)");
    expect(emailSpy.sent[0]?.text).toContain("dealer-response (1)");
  });

  test("sendDigest returns sent=false when there's nothing to send", async () => {
    await Notifications.updatePreferences({
      userId: "u1",
      channels: { "in-app": true, email: true, digest: true },
      categories: {
        message: true,
        "price-change": true,
        "dealer-response": true,
        payment: true,
        "deal-status": true,
        system: true,
      },
      email: "u1@example.com",
    });
    const emailSpy = makeEmailSpy();
    setEmailClient(emailSpy.client);
    const result = await Notifications.sendDigest({ userId: "u1" });
    expect(result.sent).toBe(false);
    expect(emailSpy.sent).toHaveLength(0);
  });
});
