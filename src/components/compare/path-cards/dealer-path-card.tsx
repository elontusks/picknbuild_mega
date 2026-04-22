"use client";

import type { IntakeState, ListingObject, PathQuote } from "@/contracts";
import { RiskBadge, TitleBadge } from "../badges";
import { PathCardShell } from "./path-card-shell";
import { SelectPathButton } from "./select-path-button";
import { pctLabel, TERM_LABEL, usd } from "@/lib/compare/formatters";

type Props = {
  listing: ListingObject;
  intake: IntakeState;
  quote: PathQuote;
  isBestFit?: boolean;
  onSelected?: () => void;
};

/**
 * Dealer path card. PathQuote.approvedBool === false → "not approved" lockout
 * that disables the Select CTA (surfacing the credit-tier reality up front).
 */
export function DealerPathCard({
  listing,
  intake,
  quote,
  isBestFit,
  onSelected,
}: Props) {
  const notApproved = quote.approvedBool === false;

  const headline = (() => {
    const total = `All-in ${usd(quote.total)}`;
    if (quote.monthly !== undefined && quote.apr !== undefined) {
      return `${total} · ${usd(quote.monthly)}/mo @ ${pctLabel(quote.apr)} APR${
        quote.term ? ` (${TERM_LABEL[quote.term]})` : ""
      }`;
    }
    if (quote.monthly !== undefined) {
      return `${total} · ${usd(quote.monthly)}/mo${
        quote.term ? ` (${TERM_LABEL[quote.term]})` : ""
      }`;
    }
    return total;
  })();

  const sticker = listing.price ?? listing.binPrice;

  return (
    <PathCardShell
      path="dealer"
      isBestFit={isBestFit}
      headline={headline}
      barrierLine={quote.barrierLine}
      badges={
        <>
          <TitleBadge status={quote.titleStatus} />
          <RiskBadge
            creditScore={intake.creditScore}
            noCredit={intake.noCredit}
          />
        </>
      }
      body={
        <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-zinc-700 dark:text-zinc-200">
          {sticker !== undefined ? (
            <>
              <dt className="text-zinc-500 dark:text-zinc-400">Sticker</dt>
              <dd className="text-right">{usd(sticker)}</dd>
            </>
          ) : null}
          {quote.down !== undefined ? (
            <>
              <dt className="text-zinc-500 dark:text-zinc-400">Down</dt>
              <dd className="text-right">{usd(quote.down)}</dd>
            </>
          ) : null}
          {quote.monthly !== undefined ? (
            <>
              <dt className="text-zinc-500 dark:text-zinc-400">Monthly</dt>
              <dd className="text-right">{usd(quote.monthly)}</dd>
            </>
          ) : null}
          {quote.apr !== undefined ? (
            <>
              <dt className="text-zinc-500 dark:text-zinc-400">APR</dt>
              <dd className="text-right">{pctLabel(quote.apr)}</dd>
            </>
          ) : null}
        </dl>
      }
      extras={
        notApproved ? (
          <p
            data-testid="path-card-dealer-not-approved"
            className="rounded bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 dark:bg-rose-950/50 dark:text-rose-200"
          >
            Not approved at your credit tier. Try another path.
          </p>
        ) : null
      }
      actions={
        <SelectPathButton
          path="dealer"
          listingId={listing.id}
          label="Contact dealer"
          disabled={notApproved}
          onSelected={onSelected}
        />
      }
    />
  );
}
