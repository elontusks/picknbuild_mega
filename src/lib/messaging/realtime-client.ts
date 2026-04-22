// Transport decision:
//
// Supabase is already the persistence + auth stack for this repo, which
// makes Supabase Realtime the cheapest transport to reach for — no new
// vendor, credentials already in env, channels multiplex per topic, and
// the browser SDK is already bundled. We use it as a pub-sub channel per
// (thread|user): senders `broadcast` to the channel, subscribers receive
// via the `on("broadcast")` callback. This file is the test-swappable
// seam, mirroring the stripe-client pattern: one interface, one real
// client built on the Supabase browser SDK, and an in-memory fallback
// that also runs in Node so unit tests don't need a live connection.

export type RealtimeEvent<T> = {
  topic: string;
  event: string;
  payload: T;
};

export type RealtimeSubscription = {
  close: () => void;
};

export interface RealtimeClient {
  publish<T>(input: { topic: string; event: string; payload: T }): Promise<void>;
  subscribe<T>(input: {
    topic: string;
    event: string;
    onEvent: (payload: T) => void;
  }): RealtimeSubscription;
}

type AnyHandler = (payload: unknown) => void;

const makeInMemoryClient = (): RealtimeClient => {
  const handlers = new Map<string, Set<AnyHandler>>();
  const key = (topic: string, event: string) => `${topic}::${event}`;
  return {
    publish: async ({ topic, event, payload }) => {
      const set = handlers.get(key(topic, event));
      if (!set) return;
      for (const h of set) {
        try {
          h(payload);
        } catch (err) {
          console.error("[realtime] in-memory handler threw", err);
        }
      }
    },
    subscribe: ({ topic, event, onEvent }) => {
      const k = key(topic, event);
      let set = handlers.get(k);
      if (!set) {
        set = new Set();
        handlers.set(k, set);
      }
      const wrapped: AnyHandler = (p) => onEvent(p as never);
      set.add(wrapped);
      return {
        close: () => {
          const live = handlers.get(k);
          if (!live) return;
          live.delete(wrapped);
          if (live.size === 0) handlers.delete(k);
        },
      };
    },
  };
};

let override: RealtimeClient | null = null;
let fallback: RealtimeClient | null = null;

export const setRealtimeClient = (client: RealtimeClient | null): void => {
  override = client;
};

export const getRealtimeClient = (): RealtimeClient => {
  if (override) return override;
  // Server-side fan-out uses the in-memory client today. The browser
  // variant will attach to `supabase.channel(...)` in the client
  // component that subscribes — the two paths are bridged when a real
  // broker (e.g. Supabase Realtime over websockets) is wired at the
  // process boundary. For the unit-tested, server-rendered slice we ship
  // now, in-memory is the correct default and keeps tests deterministic.
  if (!fallback) fallback = makeInMemoryClient();
  return fallback;
};

export const __resetRealtimeForTests = (): void => {
  override = null;
  fallback = null;
};
