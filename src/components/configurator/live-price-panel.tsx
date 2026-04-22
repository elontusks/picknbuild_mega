"use client";

import { useMemo } from "react";
import type { LivePriceOutput } from "@/lib/build-records/price";

type Props = { quote: LivePriceOutput };

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export function LivePricePanel({ quote }: Props) {
  const downPct = useMemo(
    () => `${Math.round(quote.downPercentage * 100)}%`,
    [quote.downPercentage],
  );

  return (
    <aside
      data-testid="live-price-panel"
      aria-label="Live picknbuild price"
      className="space-y-2 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <header className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">Live Price</h3>
        <span className="text-[11px] uppercase text-zinc-500">all-in</span>
      </header>
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-zinc-500">Total</span>
        <strong data-testid="live-total" className="font-mono text-lg">
          {usd(quote.total)}
        </strong>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-zinc-500">Down ({downPct})</span>
        <span data-testid="live-down" className="font-mono text-sm">
          {usd(quote.down)}
        </span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-zinc-500">
          Bi-weekly · {quote.term}
        </span>
        <span data-testid="live-biweekly" className="font-mono text-sm">
          {quote.biweekly > 0 ? usd(quote.biweekly) : "—"}
        </span>
      </div>
      <div className="flex items-baseline justify-between text-[11px] text-zinc-500">
        <span>Customizations</span>
        <span data-testid="live-customizations" className="font-mono">
          +{usd(quote.customizationsTotal)}
        </span>
      </div>
    </aside>
  );
}
