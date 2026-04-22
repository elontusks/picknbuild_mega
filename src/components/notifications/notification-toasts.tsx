"use client";

import { useEffect, useState } from "react";
import type { Notification } from "@/contracts";

type ToastRow = { key: string; notification: Notification };

// Thin client-side toaster. The canonical delivery path is the realtime
// channel `user-notifications:{userId}` (see src/lib/messaging/topics.ts).
// In prod the Supabase browser SDK attaches to that channel; for now we
// drain from a typed `window` hook so a page can hand-feed toasts to the
// renderer during tests or preview. The component stays mounted in the
// shell and no-ops when there's nothing to show.
export function NotificationToasts() {
  const [toasts, setToasts] = useState<ToastRow[]>([]);

  useEffect(() => {
    const push = (n: Notification) => {
      const key = `${n.id}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev, { key, notification: n }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.key !== key));
      }, 5000);
    };
    const w = window as unknown as {
      __pnbEmitToast?: (n: Notification) => void;
    };
    w.__pnbEmitToast = push;
    return () => {
      if (w.__pnbEmitToast === push) delete w.__pnbEmitToast;
    };
  }, []);

  if (toasts.length === 0) return null;
  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2"
      data-testid="notification-toasts"
      aria-live="polite"
    >
      {toasts.map(({ key, notification }) => {
        const payload = notification.payload as { title?: string } | null;
        return (
          <div
            key={key}
            data-testid="notification-toast"
            className="pointer-events-auto rounded-md border border-zinc-200 bg-white px-3 py-2 shadow-md dark:border-zinc-800 dark:bg-zinc-950"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {notification.category}
            </p>
            <p className="text-sm text-zinc-900 dark:text-zinc-100">
              {payload?.title ?? "New notification"}
            </p>
          </div>
        );
      })}
    </div>
  );
}
