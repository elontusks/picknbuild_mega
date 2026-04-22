"use client";

import { useState } from "react";
import { formatUsd } from "./format";

type Props = {
  amount: number;
  label: string;
  onSubmit: (paymentMethodId: string) => Promise<void>;
  disabled?: boolean;
};

// Thin client wrapper that collects a Stripe PaymentMethod id and hands it to
// the submit callback. A real integration wires the Stripe Elements card
// form here; in our tests + dev mode we accept a test-mode id directly (e.g.
// "pm_card_visa") which Stripe's sandbox resolves against the 4242 test
// card. The goal is a single surface the rest of the app can drop in.

export function PaymentProcessingInterface({
  amount,
  label,
  onSubmit,
  disabled,
}: Props) {
  const [pm, setPm] = useState("pm_card_visa");
  const [state, setState] = useState<
    { kind: "idle" } | { kind: "submitting" } | { kind: "error"; message: string }
  >({ kind: "idle" });

  const handle = async () => {
    if (!pm.trim()) {
      setState({ kind: "error", message: "Enter a payment method id" });
      return;
    }
    setState({ kind: "submitting" });
    try {
      await onSubmit(pm.trim());
      setState({ kind: "idle" });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Charge failed",
      });
    }
  };

  const busy = state.kind === "submitting";

  return (
    <form
      data-testid="payment-processing"
      className="space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
      onSubmit={(e) => {
        e.preventDefault();
        void handle();
      }}
    >
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-zinc-500">{label}</span>
        <strong className="font-mono text-lg">{formatUsd(amount)}</strong>
      </div>
      <label className="block text-xs text-zinc-500">
        Payment method id
        <input
          data-testid="payment-method-input"
          value={pm}
          onChange={(e) => setPm(e.target.value)}
          disabled={busy || disabled}
          className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      {state.kind === "error" ? (
        <p
          data-testid="payment-error"
          className="text-xs text-red-600 dark:text-red-400"
        >
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        data-testid="payment-submit"
        disabled={busy || disabled}
        className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
      >
        {busy ? "Processing…" : `Pay ${formatUsd(amount)}`}
      </button>
    </form>
  );
}
