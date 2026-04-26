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
      className="space-y-2 rounded-lg border border-border bg-background p-4-800-950"
    >
      <header className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">Live Price</h3>
        <span className="text-[11px] uppercase text-muted-foreground">all-in</span>
      </header>
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground">Total</span>
        <strong data-testid="live-total" className="font-mono text-lg">
          {usd(quote.total)}
        </strong>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground">Down ({downPct})</span>
        <span data-testid="live-down" className="font-mono text-sm">
          {usd(quote.down)}
        </span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground">
          Bi-weekly · {quote.term}
        </span>
        <span data-testid="live-biweekly" className="font-mono text-sm">
          {quote.biweekly > 0 ? usd(quote.biweekly) : "—"}
        </span>
      </div>
      <div className="flex items-baseline justify-between text-[11px] text-muted-foreground">
        <span>Customizations</span>
        <span data-testid="live-customizations" className="font-mono">
          +{usd(quote.customizationsTotal)}
        </span>
      </div>
    </aside>
  );
}
