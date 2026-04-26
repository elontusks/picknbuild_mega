import type { ListingObject, PathQuote } from "@/contracts";
import { BarrierToEntryLine } from "./barrier-to-entry";
import { BuyingPowerLayerView } from "./buying-power";

const usd = (n: number) => `$${n.toLocaleString()}`;

type Props = {
  quote: PathQuote;
  listing?: ListingObject;
};

/**
 * Private Seller Gap Logic Module (ch/09). Cash-only path; renders the
 * seller's ask + tax/transfer-fee all-in and the barrier-to-entry line.
 */
export function PrivateGapModule({ quote, listing }: Props) {
  const ask = listing?.price;
  return (
    <section
      data-decision="gap-module-private"
      data-testid="gap-module-private"
      className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4-800-950"
    >
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Private seller — where you stand
        </h3>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Cash only
        </span>
      </header>
      <dl
        data-testid="private-breakdown"
        className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground"
      >
        {ask !== undefined ? (
          <>
            <dt className="text-muted-foreground">Seller ask</dt>
            <dd className="text-right font-medium">{usd(ask)}</dd>
          </>
        ) : null}
        <dt className="text-muted-foreground">All-in cash</dt>
        <dd className="text-right font-semibold">{usd(quote.total)}</dd>
      </dl>
      <BarrierToEntryLine path="private" line={quote.barrierLine} />
      <BuyingPowerLayerView quote={quote} />
    </section>
  );
}
