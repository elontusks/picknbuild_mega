import type { ListingObject, PathQuote } from "@/contracts";
import { BarrierToEntryLine } from "./barrier-to-entry";
import { BuyingPowerLayerView } from "./buying-power";

const usd = (n: number) => `$${n.toLocaleString()}`;

type Props = {
  quote: PathQuote;
  /** Optional listing context — surfaces current bid / BIN / fees if present. */
  listing?: ListingObject;
};

/**
 * Auction Gap Logic Module (ch/09, ch/16). Auction is **DIY only** — see
 * ARCHITECTURE §2 — so this module renders the bid / BIN / fees / all-in
 * estimate the buyer needs to act on themselves. No "Start Auction Service"
 * CTA; that path was dropped (§7).
 */
export function AuctionGapModule({ quote, listing }: Props) {
  const currentBid = listing?.currentBid;
  const binPrice = listing?.binPrice;
  const fees = listing?.fees;
  const market = listing?.estimatedMarketValue;

  return (
    <section
      data-decision="gap-module-auction"
      data-testid="gap-module-auction"
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
          Auction — where you stand
        </h3>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          DIY estimate
        </span>
      </header>
      <dl
        data-testid="auction-breakdown"
        className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-zinc-700 dark:text-zinc-200"
      >
        {currentBid !== undefined ? (
          <>
            <dt className="text-zinc-500 dark:text-zinc-400">Current bid</dt>
            <dd className="text-right font-medium">{usd(currentBid)}</dd>
          </>
        ) : null}
        {binPrice !== undefined ? (
          <>
            <dt className="text-zinc-500 dark:text-zinc-400">Buy-it-now</dt>
            <dd className="text-right font-medium">{usd(binPrice)}</dd>
          </>
        ) : null}
        {market !== undefined ? (
          <>
            <dt className="text-zinc-500 dark:text-zinc-400">Market est.</dt>
            <dd className="text-right font-medium">{usd(market)}</dd>
          </>
        ) : null}
        {fees !== undefined ? (
          <>
            <dt className="text-zinc-500 dark:text-zinc-400">Buyer fees</dt>
            <dd className="text-right font-medium">{usd(fees)}</dd>
          </>
        ) : null}
        <dt className="text-zinc-500 dark:text-zinc-400">All-in estimate</dt>
        <dd className="text-right font-semibold">{usd(quote.total)}</dd>
      </dl>
      <BarrierToEntryLine path="auction" line={quote.barrierLine} />
      <BuyingPowerLayerView quote={quote} />
    </section>
  );
}
