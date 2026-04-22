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
 * Dealer Gap Logic Module (ch/09, ch/14). Renders down / monthly / total /
 * interest paid and the barrier-to-entry line for the current term. Falls
 * back to an approval-denied state when `approvedBool === false`.
 */
export function DealerGapModule({ quote }: Props) {
  const notApproved = quote.approvedBool === false;
  const term = quote.term ?? "3y";
  const interestEst =
    quote.monthly !== undefined && quote.total !== undefined && term !== "cash"
      ? Math.max(0, quote.monthly * (parseInt(term, 10) * 12) - quote.total)
      : 0;

  return (
    <section
      data-decision="gap-module-dealer"
      data-testid="gap-module-dealer"
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
          Dealer — where you stand
        </h3>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Term {TERM_LABEL[term]}
        </span>
      </header>
      {notApproved ? (
        <p
          data-testid="dealer-not-approved"
          className="rounded bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 dark:bg-rose-950/50 dark:text-rose-200"
        >
          Your credit tier doesn&apos;t clear dealer approval right now.
        </p>
      ) : (
        <dl
          data-testid="dealer-breakdown"
          className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-zinc-700 dark:text-zinc-200"
        >
          {quote.down !== undefined ? (
            <>
              <dt className="text-zinc-500 dark:text-zinc-400">Down</dt>
              <dd className="text-right font-medium">{usd(quote.down)}</dd>
            </>
          ) : null}
          {quote.monthly !== undefined ? (
            <>
              <dt className="text-zinc-500 dark:text-zinc-400">Monthly</dt>
              <dd className="text-right font-medium">{usd(quote.monthly)}</dd>
            </>
          ) : null}
          {quote.apr !== undefined ? (
            <>
              <dt className="text-zinc-500 dark:text-zinc-400">APR</dt>
              <dd className="text-right font-medium">
                {(quote.apr * 100).toFixed(1)}%
              </dd>
            </>
          ) : null}
          <dt className="text-zinc-500 dark:text-zinc-400">All-in total</dt>
          <dd className="text-right font-semibold">{usd(quote.total)}</dd>
          {interestEst > 0 ? (
            <>
              <dt className="text-zinc-500 dark:text-zinc-400">
                Interest over term
              </dt>
              <dd className="text-right font-medium">
                ~{usd(Math.round(interestEst))}
              </dd>
            </>
          ) : null}
        </dl>
      )}
      <BarrierToEntryLine path="dealer" line={quote.barrierLine} />
      <BuyingPowerLayerView quote={quote} />
    </section>
  );
}
