"use client";

import { useState } from "react";
import { SubscriptionStatusDisplay } from "./subscription-status-display";
import type {
  Subscription,
  SubscriptionPlan,
} from "@/services/team-14-payments";

type Props = {
  initialSubscription: Subscription | null;
};

export function DealerSubscriptionManagementPanel({
  initialSubscription,
}: Props) {
  const [subscription, setSubscription] = useState<Subscription | null>(
    initialSubscription,
  );
  const [plan, setPlan] = useState<SubscriptionPlan>("dealer-basic");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Start failed (${res.status})`);
      }
      const body = (await res.json()) as { subscription: Subscription };
      setSubscription(body.subscription);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Start failed");
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ atPeriodEnd: true }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Cancel failed (${res.status})`);
      }
      const body = (await res.json()) as { subscription: Subscription };
      setSubscription(body.subscription);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      data-testid="dealer-subscription-panel"
      className="space-y-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <h2 className="text-base font-semibold">Dealer subscription</h2>
      <SubscriptionStatusDisplay subscription={subscription} />
      {error ? (
        <p
          data-testid="subscription-panel-error"
          className="text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      ) : null}
      {subscription && subscription.status !== "cancelled" ? (
        <button
          type="button"
          data-testid="subscription-cancel"
          disabled={busy || subscription.cancelAtPeriodEnd}
          onClick={cancel}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-700"
        >
          {subscription.cancelAtPeriodEnd
            ? "Cancellation scheduled"
            : "Cancel at period end"}
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <label className="text-sm">
            Plan{" "}
            <select
              data-testid="subscription-plan-select"
              value={plan}
              onChange={(e) => setPlan(e.target.value as SubscriptionPlan)}
              disabled={busy}
              className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="dealer-basic">Basic ($99 / mo)</option>
              <option value="dealer-pro">Pro ($198 / mo)</option>
            </select>
          </label>
          <button
            type="button"
            data-testid="subscription-start"
            disabled={busy}
            onClick={start}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
          >
            {busy ? "Starting…" : "Start subscription"}
          </button>
        </div>
      )}
    </section>
  );
}
