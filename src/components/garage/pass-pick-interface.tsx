"use client";

import { useOptimistic, useState, useTransition } from "react";
import type { GarageDecision } from "@/lib/garage/store";

type Props = {
  listingId: string;
  initialDecision: GarageDecision;
  onChange?: (decision: GarageDecision) => void;
};

/**
 * Inline pass / pick toggle. Writes through /api/garage/[listingId]/decision
 * which in turn calls team-08-garage.updateDecision (persisted via Team 15
 * storage). Uses optimistic UI so the user sees their choice flip immediately;
 * any server error snaps the state back and shows an inline error.
 */
export function PassPickDecisionInterface({
  listingId,
  initialDecision,
  onChange,
}: Props) {
  const [committed, setCommitted] = useState<GarageDecision>(initialDecision);
  const [optimistic, setOptimistic] = useOptimistic(committed);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const select = (decision: GarageDecision) => {
    const next: GarageDecision =
      committed === decision ? null : decision;
    setError(null);
    startTransition(async () => {
      setOptimistic(next);
      try {
        const res = await fetch(
          `/api/garage/${encodeURIComponent(listingId)}/decision`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ decision: next }),
          },
        );
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        if (!res.ok) {
          setError(body.error ?? "Could not save decision");
          return;
        }
        setCommitted(next);
        onChange?.(next);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Network error");
      }
    });
  };

  return (
    <div
      data-testid="pass-pick"
      data-decision={optimistic ?? "none"}
      className="flex items-center gap-1"
    >
      <button
        type="button"
        data-testid="pass-pick-pick"
        aria-pressed={optimistic === "pick"}
        onClick={() => select("pick")}
        disabled={isPending}
        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
          optimistic === "pick"
            ? "bg-emerald-500 text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted-800 dark:hover:bg-zinc-700"
        }`}
      >
        Pick
      </button>
      <button
        type="button"
        data-testid="pass-pick-pass"
        aria-pressed={optimistic === "pass"}
        onClick={() => select("pass")}
        disabled={isPending}
        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
          optimistic === "pass"
            ? "bg-rose-500 text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted-800 dark:hover:bg-zinc-700"
        }`}
      >
        Pass
      </button>
      {error ? (
        <span
          data-testid="pass-pick-error"
          className="ml-1 text-[11px] text-rose-600 dark:text-rose-400"
        >
          {error}
        </span>
      ) : null}
    </div>
  );
}
