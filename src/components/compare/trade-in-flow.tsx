"use client";

import { useState, useTransition } from "react";
import type { TradeIn, TitleStatus } from "@/contracts";
import { useBuildRecord } from "@/lib/compare/build-record-store";
import { usd } from "@/lib/compare/formatters";

type ApiResponse =
  | { ok: true; estimatedTradeInValue: number }
  | { ok: false; reason: string };

const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/i;

async function requestTradeInEstimate(input: {
  vin: string;
  titleStatus: Extract<TitleStatus, "clean" | "rebuilt">;
}): Promise<ApiResponse> {
  const res = await fetch("/api/pricing/trade-in", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = (await res.json().catch(() => ({}))) as {
    estimatedTradeInValue?: number;
    reason?: string;
    error?: string;
  };
  if (!res.ok || typeof body.estimatedTradeInValue !== "number") {
    return {
      ok: false,
      reason: body.reason ?? body.error ?? "Trade-in estimate failed",
    };
  }
  return { ok: true, estimatedTradeInValue: body.estimatedTradeInValue };
}

/**
 * Entry form for the trade-in flow. Captures {vin, titleStatus}, hits Team
 * 11's estimator via /api/pricing/trade-in, and writes the resulting
 * estimatedValue into the draft BuildRecord. picknbuild / Dealer pricing will
 * subtract the estimate before showing the buyer's all-in.
 */
export function TradeInFlow() {
  const { build, setTradeIn } = useBuildRecord();
  const [vin, setVin] = useState(build.tradeIn?.vin ?? "");
  const [titleStatus, setTitleStatus] = useState<
    Extract<TitleStatus, "clean" | "rebuilt">
  >(build.tradeIn?.titleStatus ?? "clean");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    const trimmed = vin.trim().toUpperCase();
    if (!VIN_PATTERN.test(trimmed)) {
      setError("Enter a 17-character VIN");
      return;
    }
    startTransition(async () => {
      const result = await requestTradeInEstimate({
        vin: trimmed,
        titleStatus,
      });
      if (!result.ok) {
        setError(result.reason);
        return;
      }
      const trade: TradeIn = {
        vin: trimmed,
        titleStatus,
        estimatedValue: result.estimatedTradeInValue,
      };
      setTradeIn(trade);
    });
  };

  const clear = () => {
    setTradeIn(undefined);
    setVin("");
    setError(null);
  };

  return (
    <details
      data-testid="trade-in-flow"
      className="rounded-md border border-border px-2 py-1.5 text-xs-800"
    >
      <summary className="cursor-pointer select-none font-semibold text-muted-foreground">
        Trade in a car
        {build.tradeIn?.estimatedValue !== undefined ? (
          <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800-900/40 dark:text-emerald-100">
            {usd(build.tradeIn.estimatedValue)} toward build
          </span>
        ) : null}
      </summary>
      <div className="mt-2 flex flex-col gap-2">
        <label className="flex flex-col gap-0.5">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            VIN
          </span>
          <input
            type="text"
            value={vin}
            onChange={(e) => setVin(e.target.value)}
            data-testid="trade-in-vin"
            placeholder="17-character VIN"
            className="rounded border border-border px-2 py-1 font-mono text-xs-700-900"
            maxLength={17}
          />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Title status
          </span>
          <select
            value={titleStatus}
            onChange={(e) =>
              setTitleStatus(
                e.target.value as Extract<TitleStatus, "clean" | "rebuilt">,
              )
            }
            data-testid="trade-in-title"
            className="rounded border border-border px-2 py-1 text-xs-700-900"
          >
            <option value="clean">Clean</option>
            <option value="rebuilt">Rebuilt</option>
          </select>
        </label>
        {error ? (
          <p
            data-testid="trade-in-error"
            className="text-[11px] text-rose-600 dark:text-rose-400"
          >
            {error}
          </p>
        ) : null}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            data-testid="trade-in-submit"
            className="rounded bg-muted px-2 py-1 text-[11px] font-semibold text-primary-foreground disabled:bg-zinc-400"
          >
            {pending ? "Estimating…" : "Estimate"}
          </button>
          {build.tradeIn ? (
            <button
              type="button"
              onClick={clear}
              data-testid="trade-in-clear"
              className="text-[11px] text-muted-foreground underline hover:text-zinc-800"
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>
    </details>
  );
}
