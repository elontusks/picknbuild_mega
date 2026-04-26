import type { PathQuote, Term } from "@/contracts";
import { BarrierToEntryLine } from "./barrier-to-entry";
import { BuyingPowerLayerView } from "./buying-power";

const TERM_LABEL: Record<Term, string> = {
  cash: "Cash",
  "1y": "1 yr",
  "2y": "2 yr",
  "3y": "3 yr",
  "4y": "4 yr",
  "5y": "5 yr",
};

const usd = (n: number) => `$${n.toLocaleString()}`;

type Props = { quote: PathQuote };

/**
 * picknbuild Gap Logic Module (ch/09, ch/10). Renders down / biweekly / total
 * for the current term plus the barrier-to-entry line. Cash term collapses
 * biweekly to 0 — we render the total cash ask instead.
 */
export function PicknbuildGapModule({ quote }: Props) {
  const term = quote.term ?? "3y";

  return (
    <section
      data-decision="gap-module-picknbuild"
      data-testid="gap-module-picknbuild"
      className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4-800-950"
    >
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          picknbuild — where you stand
        </h3>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Term {TERM_LABEL[term]}
        </span>
      </header>
      <dl
        data-testid="picknbuild-breakdown"
        className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground"
      >
        {quote.down !== undefined ? (
          <>
            <dt className="text-muted-foreground">Down</dt>
            <dd className="text-right font-medium">{usd(quote.down)}</dd>
          </>
        ) : null}
        {quote.biweekly !== undefined ? (
          <>
            <dt className="text-muted-foreground">Bi-weekly</dt>
            <dd className="text-right font-medium">{usd(quote.biweekly)}</dd>
          </>
        ) : term === "cash" ? (
          <>
            <dt className="text-muted-foreground">Payment</dt>
            <dd className="text-right font-medium">Cash at signing</dd>
          </>
        ) : null}
        <dt className="text-muted-foreground">All-in total</dt>
        <dd className="text-right font-semibold">{usd(quote.total)}</dd>
      </dl>
      <BarrierToEntryLine path="picknbuild" line={quote.barrierLine} />
      <BuyingPowerLayerView quote={quote} />
    </section>
  );
}
