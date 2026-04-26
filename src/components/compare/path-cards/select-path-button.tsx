"use client";

import { useState, useTransition } from "react";
import type { PathKind } from "@/contracts";

type Props = {
  path: PathKind;
  listingId: string;
  label: string;
  disabled?: boolean;
  onSelected?: (path: PathKind) => void;
  className?: string;
};

/**
 * Emits a `select(path)` event into Team 12's conversion state machine by
 * POSTing to /api/conversions/decide. The button renders a neutral loading
 * state while the request is in flight and a one-line error if the write
 * rejects — keeps Team 5's surface resilient to transient API blips.
 */
export function SelectPathButton({
  path,
  listingId,
  label,
  disabled,
  onSelected,
  className,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    if (disabled || pending) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/conversions/decide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path, listingId }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error ?? "Unable to record selection");
        }
        setDone(true);
        onSelected?.(path);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unable to record selection");
      }
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || pending}
        data-testid={`select-path-${path}`}
        data-path={path}
        className={`inline-flex items-center justify-center rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:disabled:bg-zinc-700 ${className ?? ""}`}
      >
        {pending ? "Selecting…" : done ? "Selected ✓" : label}
      </button>
      {error ? (
        <p
          data-testid={`select-path-${path}-error`}
          className="text-[11px] text-rose-600 dark:text-rose-400"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
