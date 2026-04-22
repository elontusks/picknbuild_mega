"use client";

import type { PathKind, PathQuote } from "@/contracts";
import { useIntakeState } from "@/lib/intake";
import { computeBuyingPower } from "@/lib/decision";
import { BuyingPowerVisualizationBar } from "./buying-power-bar";

type Props = {
  quote: Pick<PathQuote, "total"> & { path: PathKind };
};

/**
 * Buying Power Layer (ch/24). Wraps `computeBuyingPower` against the active
 * path's quote + current IntakeState.cash and renders the visualization bar.
 */
export function BuyingPowerLayerView({ quote }: Props) {
  const intake = useIntakeState();
  const layer = computeBuyingPower({ cash: intake.cash }, { total: quote.total });
  return (
    <div
      data-decision="buying-power-layer"
      data-testid={`buying-power-layer-${quote.path}`}
      className="flex flex-col gap-2"
    >
      <header className="flex items-center justify-between text-xs">
        <h4 className="font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Your buying power
        </h4>
        <span className="text-zinc-500 dark:text-zinc-400">
          All-in ${layer.totalCost.toLocaleString()}
        </span>
      </header>
      <BuyingPowerVisualizationBar layer={layer} />
    </div>
  );
}
