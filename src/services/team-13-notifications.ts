import {
  makeFixtureNotification,
  type Notification,
  type NotificationCategory,
  type NotificationChannel,
} from "@/contracts";
import * as Storage from "./team-15-storage";
import {
  getRealtimeClient,
} from "@/lib/messaging/realtime-client";
import { EVENTS, userNotificationsTopic } from "@/lib/messaging/topics";
import { getEmailClient } from "@/lib/messaging/email-client";
import { assembleDigest, type DigestPayload } from "@/lib/messaging/digest";

// Team 13 — notification service.
//
// Writes Notification rows via Team 15 storage, routes them per the
// recipient's preferences, and fans the in-app channel out via the
// realtime client (see src/lib/messaging/realtime-client.ts). Every
// existing export from the original stub is preserved verbatim so
// Team 12 / Team 14 callers (which dispatch fire-and-forget per
// team-12-workflows.ts:57) keep compiling and keep their error traps
// working — the real transport still must not throw synchronously.
//
// Buckets:
//   notifications         → Notification keyed by id
//   notifications_by_user → string[] of notification ids, keyed by userId
//   notif_preferences     → NotificationPreferences, keyed by userId

const NOTIFICATIONS_BUCKET = "notifications";
const NOTIFICATIONS_INDEX_BUCKET = "notifications_by_user";
const PREFERENCES_BUCKET = "notif_preferences";

const newId = (prefix: string): string => {
  const rand =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${rand}`;
};

const nowIso = () => new Date().toISOString();

// -- preferences ----------------------------------------------------------

export type NotificationPreferences = {
  userId: string;
  channels: Record<NotificationChannel, boolean>;
  categories: Record<NotificationCategory, boolean>;
  // Email used for `email`/`digest` channels. Optional — the Notification
  // Service won't raise if missing, it will just drop those channels for
  // this user and still route the in-app copy.
  email?: string;
};

const defaultPreferences = (userId: string): NotificationPreferences => ({
  userId,
  channels: { "in-app": true, email: true, digest: false },
  categories: {
    message: true,
    "price-change": true,
    "dealer-response": true,
    payment: true,
    "deal-status": true,
    system: true,
  },
});

export const getPreferences = async (
  userId: string,
): Promise<NotificationPreferences> => {
  const stored = await Storage.getRecord<NotificationPreferences>(
    PREFERENCES_BUCKET,
    userId,
  );
  return stored ?? defaultPreferences(userId);
};

export const updatePreferences = async (
  prefs: NotificationPreferences,
): Promise<NotificationPreferences> => {
  await Storage.putRecord(PREFERENCES_BUCKET, prefs.userId, prefs);
  return prefs;
};

// -- list / unread -------------------------------------------------------

export const listNotifications = async (
  userId: string,
): Promise<Notification[]> => {
  const ids =
    (await Storage.getRecord<string[]>(
      NOTIFICATIONS_INDEX_BUCKET,
      userId,
    )) ?? [];
  const records = await Promise.all(
    ids.map((id) => Storage.getRecord<Notification>(NOTIFICATIONS_BUCKET, id)),
  );
  return records
    .filter((n): n is Notification => n !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const countUnread = async (userId: string): Promise<number> => {
  const all = await listNotifications(userId);
  return all.filter((n) => !n.readAt).length;
};

export const listUnread = async (userId: string): Promise<Notification[]> => {
  const all = await listNotifications(userId);
  return all.filter((n) => !n.readAt);
};

// -- emit + fan-out ------------------------------------------------------

const channelsForPreferences = (
  requested: NotificationChannel[] | undefined,
  prefs: NotificationPreferences,
  category: NotificationCategory,
): NotificationChannel[] => {
  const base = requested ?? ["in-app"];
  if (!prefs.categories[category]) return [];
  return base.filter((c) => prefs.channels[c]);
};

const buildRecord = (input: {
  userId: string;
  category: NotificationCategory;
  payload: unknown;
  channel: NotificationChannel;
}): Notification => ({
  id: newId("notif"),
  userId: input.userId,
  category: input.category,
  payload: input.payload,
  channel: input.channel,
  createdAt: nowIso(),
});

const persistBatch = async (records: Notification[]): Promise<void> => {
  if (records.length === 0) return;
  // Row writes can safely parallelize — they target distinct ids. The
  // per-user index is NOT safe to update concurrently: read-modify-write
  // races would drop ids. Build the new index in one pass and write once.
  await Promise.all(
    records.map((r) => Storage.putRecord(NOTIFICATIONS_BUCKET, r.id, r)),
  );
  const [first] = records;
  if (!first) return;
  const userId = first.userId;
  const existing =
    (await Storage.getRecord<string[]>(
      NOTIFICATIONS_INDEX_BUCKET,
      userId,
    )) ?? [];
  const merged = existing.slice();
  for (const r of records) {
    if (!merged.includes(r.id)) merged.push(r.id);
  }
  await Storage.putRecord(NOTIFICATIONS_INDEX_BUCKET, userId, merged);
};

const routeInApp = async (record: Notification): Promise<void> => {
  try {
    await getRealtimeClient().publish({
      topic: userNotificationsTopic(record.userId),
      event: EVENTS.notificationEmitted,
      payload: record,
    });
  } catch (err) {
    console.error("[team-13-notifications] in-app publish failed", err);
  }
};

const routeEmail = async (
  record: Notification,
  prefs: NotificationPreferences,
): Promise<void> => {
  if (!prefs.email) return;
  const payload = record.payload as { title?: string } | null;
  const subject = payload?.title
    ? `PicknBuild: ${payload.title}`
    : `PicknBuild update (${record.category})`;
  try {
    await getEmailClient().send({
      to: prefs.email,
      subject,
      text: payload?.title ?? JSON.stringify(record.payload),
      tag: `notif-${record.category}`,
    });
  } catch (err) {
    console.error("[team-13-notifications] email send failed", err);
  }
};

// Exported signature is unchanged from the original stub. Internally we
// now persist + route per-preferences. Returns every persisted row (one
// per actually-delivered channel) so callers can inspect the fan-out.
export const emitNotification = async (input: {
  userId: string;
  category: NotificationCategory;
  payload: unknown;
  channels?: NotificationChannel[];
}): Promise<Notification[]> => {
  const prefs = await getPreferences(input.userId);
  const channels = channelsForPreferences(
    input.channels,
    prefs,
    input.category,
  );
  if (channels.length === 0) return [];
  const persisted = channels.map((channel) =>
    buildRecord({
      userId: input.userId,
      category: input.category,
      payload: input.payload,
      channel,
    }),
  );
  await persistBatch(persisted);
  // Channel-specific side-effects. We deliberately await inside a
  // try/catch at each route boundary so one failing channel (e.g. email
  // provider down) does not poison the others or throw back to our
  // fire-and-forget callers in team-12 / team-14.
  await Promise.all(
    persisted.map((record) => {
      if (record.channel === "in-app") return routeInApp(record);
      if (record.channel === "email") return routeEmail(record, prefs);
      // "digest" rows are persisted only — the scheduled digest job picks
      // them up and sends a single rollup. See sendDigest() below.
      return Promise.resolve();
    }),
  );
  return persisted;
};

// -- read state ----------------------------------------------------------

export const markAsRead = async (input: {
  userId: string;
  notificationId: string;
}): Promise<{ ok: true }> => {
  const record = await Storage.getRecord<Notification>(
    NOTIFICATIONS_BUCKET,
    input.notificationId,
  );
  if (!record || record.userId !== input.userId) return { ok: true };
  if (record.readAt) return { ok: true };
  await Storage.putRecord(NOTIFICATIONS_BUCKET, record.id, {
    ...record,
    readAt: nowIso(),
  });
  return { ok: true };
};

export const markAllAsRead = async (
  userId: string,
): Promise<{ ok: true; count: number }> => {
  const unread = await listUnread(userId);
  await Promise.all(
    unread.map((n) =>
      Storage.putRecord(NOTIFICATIONS_BUCKET, n.id, { ...n, readAt: nowIso() }),
    ),
  );
  return { ok: true, count: unread.length };
};

// -- digest --------------------------------------------------------------

// Assembles a digest of "digest"-channel rows (plus any unread in-app
// rollup) since `since` and emails it. Designed to be called from a cron
// or manual trigger — idempotent beyond marking what it sent as read.
export const sendDigest = async (input: {
  userId: string;
  since?: string;
  now?: Date;
}): Promise<{ sent: boolean; payload: DigestPayload }> => {
  const prefs = await getPreferences(input.userId);
  const all = await listNotifications(input.userId);
  const since = input.since;
  const candidates = all.filter((n) => {
    if (n.channel !== "digest") return false;
    if (since && n.createdAt <= since) return false;
    return true;
  });
  const payload = assembleDigest({
    userId: input.userId,
    notifications: candidates,
    ...(input.now !== undefined ? { now: input.now } : {}),
  });
  if (!prefs.email || candidates.length === 0) {
    return { sent: false, payload };
  }
  try {
    await getEmailClient().send({
      to: prefs.email,
      subject: payload.subject,
      text: payload.text,
      tag: "notif-digest",
    });
  } catch (err) {
    console.error("[team-13-notifications] digest send failed", err);
    return { sent: false, payload };
  }
  return { sent: true, payload };
};

// -- fixtures retained ---------------------------------------------------

export { makeFixtureNotification };
