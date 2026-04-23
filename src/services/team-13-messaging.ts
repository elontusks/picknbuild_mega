import {
  makeFixtureMessage,
  makeFixtureMessageThread,
  type Message,
  type MessageThread,
  type ThreadKind,
} from "@/contracts";
import * as Storage from "./team-15-storage";
import {
  getRealtimeClient,
  type RealtimeSubscription,
} from "@/lib/messaging/realtime-client";
import { EVENTS, threadTopic } from "@/lib/messaging/topics";

// Team 13 — messaging.
//
// Persists threads + messages through @/services/team-15-storage and fans
// live updates out over the realtime client (Supabase Realtime in
// production, in-memory in tests — see src/lib/messaging/realtime-client.ts
// for the decision rationale). Every exported signature from the original
// stub is preserved so in-flight Team 2 work that imports these functions
// keeps compiling unchanged.
//
// Buckets (see Team 13 prompt):
//   message_threads  → MessageThread, keyed by threadId
//   messages         → Message[],     keyed by threadId (per-thread log)
//   threads_by_user  → string[]       of threadIds, keyed by userId
//   thread_reads     → { lastReadAt },  keyed by `${threadId}:${userId}`

const THREAD_BUCKET = "message_threads";
const MESSAGES_BUCKET = "messages";
const THREADS_BY_USER_BUCKET = "threads_by_user";
const THREAD_READS_BUCKET = "thread_reads";

// Composite key: one record per (threadId, userId) pair instead of a
// {userId → lastReadAt} map keyed by threadId. This lets each markThreadRead
// be a single putRecord on a unique key, so concurrent calls from different
// participants can't clobber each other's timestamps.
const readStateId = (threadId: string, userId: string): string =>
  `${threadId}:${userId}`;

type ThreadReadRecord = { lastReadAt: string };

const newId = (prefix: string): string => {
  const rand =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${rand}`;
};

const nowIso = () => new Date().toISOString();

const appendThreadIndex = (userId: string, threadId: string) =>
  Storage.appendToList(THREADS_BY_USER_BUCKET, userId, threadId);

const loadThreadMessages = async (threadId: string): Promise<Message[]> =>
  (await Storage.getRecord<Message[]>(MESSAGES_BUCKET, threadId)) ?? [];

// -- threads --------------------------------------------------------------

export const listThreads = async (userId: string): Promise<MessageThread[]> => {
  const raw =
    (await Storage.getRecord<string[]>(THREADS_BY_USER_BUCKET, userId)) ?? [];
  // appendToList is atomic but not deduping. Dedup defensively so that a
  // double-append (e.g. replay of a fire-and-forget call) never renders
  // the same thread twice.
  const ids = Array.from(new Set(raw));
  const threads = await Promise.all(
    ids.map((id) => Storage.getRecord<MessageThread>(THREAD_BUCKET, id)),
  );
  return threads
    .filter((t): t is MessageThread => t !== null)
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
};

export const getThread = async (id: string): Promise<MessageThread | null> =>
  Storage.getRecord<MessageThread>(THREAD_BUCKET, id);

export const openOrCreateThread = async (input: {
  participants: string[];
  kind: ThreadKind;
  listingId?: string;
}): Promise<MessageThread> => {
  if (input.participants.length === 0) {
    throw new Error("openOrCreateThread: participants must be non-empty");
  }
  // Dedupe: a (kind, sorted participants, optional listing) tuple collapses
  // to a single thread. Scan the first participant's index since every
  // thread lives under all of its participants' indexes.
  const [first] = input.participants;
  if (first) {
    const raw =
      (await Storage.getRecord<string[]>(THREADS_BY_USER_BUCKET, first)) ?? [];
    const ids = Array.from(new Set(raw));
    const candidates = await Promise.all(
      ids.map((id) => Storage.getRecord<MessageThread>(THREAD_BUCKET, id)),
    );
    const sortedInput = [...input.participants].sort();
    const match = candidates.find((t): t is MessageThread => {
      if (!t) return false;
      if (t.kind !== input.kind) return false;
      if ((t.listingId ?? null) !== (input.listingId ?? null)) return false;
      const sortedT = [...t.participants].sort();
      if (sortedT.length !== sortedInput.length) return false;
      return sortedT.every((p, i) => p === sortedInput[i]);
    });
    if (match) return match;
  }

  const thread: MessageThread = {
    id: newId("thread"),
    participants: [...input.participants],
    kind: input.kind,
    ...(input.listingId !== undefined ? { listingId: input.listingId } : {}),
    lastMessageAt: nowIso(),
  };
  await Storage.putRecord(THREAD_BUCKET, thread.id, thread);
  await Promise.all(
    input.participants.map((p) => appendThreadIndex(p, thread.id)),
  );
  return thread;
};

// -- messages -------------------------------------------------------------

export type ListMessagesOptions = {
  limit?: number;
  // Paginate backward: return the `limit` newest messages with sentAt < before.
  before?: string;
};

export const listMessages = async (
  threadId: string,
  opts?: ListMessagesOptions,
): Promise<Message[]> => {
  const all = await loadThreadMessages(threadId);
  const sorted = all
    .slice()
    .sort(
      (a, b) => a.sentAt.localeCompare(b.sentAt) || a.id.localeCompare(b.id),
    );
  const before = opts?.before;
  const filtered = before
    ? sorted.filter((m) => m.sentAt < before)
    : sorted;
  const limit = opts?.limit;
  if (limit && filtered.length > limit) {
    return filtered.slice(filtered.length - limit);
  }
  return filtered;
};

export const sendMessage = async (input: {
  threadId: string;
  senderId: string;
  body: string;
  attachments?: string[];
}): Promise<Message> => {
  const message: Message = {
    id: newId("msg"),
    threadId: input.threadId,
    senderId: input.senderId,
    body: input.body,
    ...(input.attachments !== undefined
      ? { attachments: input.attachments }
      : {}),
    sentAt: nowIso(),
  };
  const existing = await loadThreadMessages(input.threadId);
  await Storage.putRecord(MESSAGES_BUCKET, input.threadId, [
    ...existing,
    message,
  ]);
  // Bump thread.lastMessageAt — keeps inbox sort stable.
  const thread = await Storage.getRecord<MessageThread>(
    THREAD_BUCKET,
    input.threadId,
  );
  if (thread) {
    await Storage.putRecord(THREAD_BUCKET, thread.id, {
      ...thread,
      lastMessageAt: message.sentAt,
    });
  }
  // Fan out to any live subscribers. Publish errors are swallowed: a
  // realtime outage must not make sendMessage throw — the message is
  // already durably persisted above.
  try {
    await getRealtimeClient().publish({
      topic: threadTopic(input.threadId),
      event: EVENTS.messageSent,
      payload: message,
    });
  } catch (err) {
    console.error("[team-13-messaging] realtime publish failed", err);
  }
  return message;
};

// Per-user read state. Each (threadId, userId) pair is its own row, so
// markThreadRead is a single putRecord with no merge. No race even when
// different participants mark the same thread read concurrently.
export const markThreadRead = async (input: {
  userId: string;
  threadId: string;
}): Promise<{ ok: true; lastReadAt: string }> => {
  const lastReadAt = nowIso();
  await Storage.putRecord<ThreadReadRecord>(
    THREAD_READS_BUCKET,
    readStateId(input.threadId, input.userId),
    { lastReadAt },
  );
  return { ok: true, lastReadAt };
};

export const getThreadReadState = async (
  threadId: string,
): Promise<Record<string, string>> => {
  const thread = await Storage.getRecord<MessageThread>(THREAD_BUCKET, threadId);
  if (!thread) return {};
  const entries = await Promise.all(
    thread.participants.map(async (userId) => {
      const row = await Storage.getRecord<ThreadReadRecord>(
        THREAD_READS_BUCKET,
        readStateId(threadId, userId),
      );
      return row ? ([userId, row.lastReadAt] as const) : null;
    }),
  );
  return Object.fromEntries(
    entries.filter((e): e is readonly [string, string] => e !== null),
  );
};

// -- socket transport -----------------------------------------------------

export type SocketHandle = { close: () => void };

export const subscribeThread = (
  threadId: string,
  onMessage: (message: Message) => void,
): SocketHandle => {
  const sub: RealtimeSubscription = getRealtimeClient().subscribe<Message>({
    topic: threadTopic(threadId),
    event: EVENTS.messageSent,
    onEvent: onMessage,
  });
  return { close: sub.close };
};

// -- fixtures retained for consumers that imported them -------------------
//
// No exports removed, no signatures changed — Team 2 imports from this
// module today and must keep compiling through our merge.

export { makeFixtureMessage, makeFixtureMessageThread };
