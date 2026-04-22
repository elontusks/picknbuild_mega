import type { BuyingPowerLayer } from "@/lib/decision";

type Props = {
  layer: BuyingPowerLayer;
};

const usd = (n: number) => `$${n.toLocaleString()}`;
const pct = (num: number, denom: number) =>
  denom > 0 ? Math.max(0, Math.min(100, (num / denom) * 100)) : 0;

/**
 * Stacked-bar render of the Buying Power layer (ch/24). Left segment shows
 * the buyer's cash applied toward the all-in total, right segment shows the
 * outside money (financing or savings gap) needed. If cash covers the cost,
 * only the left segment is rendered.
 */
export function BuyingPowerVisualizationBar({ layer }: Props) {
  const denom = Math.max(layer.totalCost, layer.yourCash);
  const cashPct = pct(layer.buyingPower, denom);
  const outsidePct = pct(layer.outsideMoneyNeeded, denom);
  const covered = layer.outsideMoneyNeeded === 0;

  return (
    <div
      data-decision="buying-power-bar"
      data-testid="buying-power-bar"
      className="flex flex-col gap-2"
    >
      <div
        className="flex h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={layer.totalCost}
        aria-valuenow={layer.buyingPower}
        aria-label="Buying power"
      >
        <div
          data-testid="bp-cash-segment"
          style={{ width: `${cashPct}%` }}
          className="h-full bg-emerald-500 dark:bg-emerald-400"
        />
        {outsidePct > 0 ? (
          <div
            data-testid="bp-outside-segment"
            style={{ width: `${outsidePct}%` }}
            className="h-full bg-amber-400 dark:bg-amber-500"
          />
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-between text-xs text-zinc-600 dark:text-zinc-300">
        <span data-testid="bp-your-cash">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 align-middle dark:bg-emerald-400" />{" "}
          Your cash <strong className="text-zinc-900 dark:text-white">{usd(layer.yourCash)}</strong>
        </span>
        {covered ? (
          <span data-testid="bp-covered" className="text-emerald-600 dark:text-emerald-400">
            Covered — {usd(layer.buyingPower)} of {usd(layer.totalCost)}
          </span>
        ) : (
          <span data-testid="bp-outside">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400 align-middle dark:bg-amber-500" />{" "}
            Outside money needed{" "}
            <strong className="text-zinc-900 dark:text-white">
              {usd(layer.outsideMoneyNeeded)}
            </strong>
          </span>
        )}
      </div>
    </div>
  );
}
