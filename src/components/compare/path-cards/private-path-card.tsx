"use client";

import type { IntakeState, ListingObject, PathQuote } from "@/contracts";
import { RiskBadge, TitleBadge } from "../badges";
import { PathCardShell } from "./path-card-shell";
import { SelectPathButton } from "./select-path-button";
import { usd } from "@/lib/compare/formatters";

type Props = {
  listing: ListingObject;
  intake: IntakeState;
  quote: PathQuote;
  isBestFit?: boolean;
  onSelected?: () => void;
};

const isNegotiable = (listing: ListingObject): boolean =>
  listing.source === "craigslist" || listing.source === "user";

export function PrivateSellerPathCard({
  listing,
  intake,
  quote,
  isBestFit,
  onSelected,
}: Props) {
  const askPrice = listing.price;
  const headline = `Cash ${usd(quote.total)}`;
  const negotiable = isNegotiable(listing);

  return (
    <PathCardShell
      path="private"
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
          {askPrice !== undefined ? (
            <>
              <dt className="text-zinc-500 dark:text-zinc-400">Ask</dt>
              <dd className="text-right">{usd(askPrice)}</dd>
            </>
          ) : null}
          <dt className="text-zinc-500 dark:text-zinc-400">All-in</dt>
          <dd className="text-right">{usd(quote.total)}</dd>
          {negotiable ? (
            <>
              <dt className="text-zinc-500 dark:text-zinc-400">Negotiable</dt>
              <dd
                className="text-right text-amber-700 dark:text-amber-300"
                data-testid="path-card-private-negotiable"
              >
                Typically
              </dd>
            </>
          ) : null}
        </dl>
      }
      actions={
        <SelectPathButton
          path="private"
          listingId={listing.id}
          label="Message seller"
          onSelected={onSelected}
        />
      }
    />
  );
}
