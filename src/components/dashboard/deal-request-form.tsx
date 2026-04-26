"use client";

import { useState, useTransition } from "react";
import { submitDealRequest } from "@/app/dashboard/actions";
import type { DealRequestKind } from "@/lib/deal-requests/types";

type Props = {
  dealId: string;
};

type FormState =
  | { kind: "idle" }
  | { kind: "success"; requestId: string; requestKind: DealRequestKind }
  | { kind: "error"; message: string };

// Upgrade / Downgrade / Voluntary-Surrender flows. The buyer picks a kind,
// writes a short reason, and the server action persists a DealRequest row.
// Team 12 / Team 15 pick these up out of band — the UI just confirms the
// submission.
export function DealRequestForm({ dealId }: Props) {
  const [kind, setKind] = useState<DealRequestKind>("upgrade");
  const [reason, setReason] = useState("");
  const [state, setState] = useState<FormState>({ kind: "idle" });
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await submitDealRequest({ dealId, kind, reason });
      if (!result.ok) {
        setState({ kind: "error", message: result.error });
        return;
      }
      setState({ kind: "success", requestId: result.requestId, requestKind: kind });
      setReason("");
    });
  };

  return (
    <section
      data-testid="deal-request-form"
      className="rounded-lg border border-border bg-background p-4-800-950"
    >
      <header className="mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Request a change
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Upgrade to a higher package, downgrade, or voluntarily surrender this
          build. A picknbuild rep will follow up.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-3">
        <fieldset className="flex flex-wrap gap-3 text-sm">
          {(
            [
              ["upgrade", "Upgrade"],
              ["downgrade", "Downgrade"],
              ["surrender", "Surrender"],
            ] as Array<[DealRequestKind, string]>
          ).map(([value, label]) => (
            <label key={value} className="inline-flex items-center gap-1">
              <input
                type="radio"
                name="deal-request-kind"
                value={value}
                checked={kind === value}
                onChange={() => setKind(value)}
                data-testid={`deal-request-kind-${value}`}
              />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>

        <label className="block text-sm">
          <span className="mb-1 block text-xs text-muted-foreground">Reason</span>
          <textarea
            data-testid="deal-request-reason"
            className="w-full rounded-md border border-border bg-transparent p-2 text-sm-700"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Briefly explain why."
          />
        </label>

        <button
          type="submit"
          data-testid="deal-request-submit"
          disabled={isPending}
          className="rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50-100"
        >
          {isPending ? "Submitting…" : "Submit request"}
        </button>

        {state.kind === "success" ? (
          <p
            data-testid="deal-request-success"
            className="text-xs text-emerald-600"
          >
            Request submitted ({state.requestKind}). We'll be in touch.
          </p>
        ) : null}
        {state.kind === "error" ? (
          <p
            data-testid="deal-request-error"
            className="text-xs text-red-600"
          >
            {state.message}
          </p>
        ) : null}
      </form>
    </section>
  );
}
