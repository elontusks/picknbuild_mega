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

const auctionTimeline = (listing: ListingObject): string => {
  if (listing.source === "copart") return "Copart closes bids on listed sale date";
  if (listing.source === "iaai") return "IAAI closes bids on listed sale date";
  return "Timeline per source";
};

/**
 * Auction path = DIY only (ARCHITECTURE §2). No platform bidding service,
 * no paid procurement. CTA sends the buyer off to act on the listing
 * themselves — we just surface the all-in math they need to decide.
 */
export function AuctionPathCard({
  listing,
  intake,
  quote,
  isBestFit,
  onSelected,
}: Props) {
  const headline = `All-in ${usd(quote.total)} estimated`;

  return (
    <PathCardShell
      path="auction"
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
        <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          {listing.currentBid !== undefined ? (
            <>
              <dt className="text-muted-foreground">Current bid</dt>
              <dd className="text-right">{usd(listing.currentBid)}</dd>
            </>
          ) : null}
          {listing.binPrice !== undefined ? (
            <>
              <dt className="text-muted-foreground">Buy it now</dt>
              <dd className="text-right">{usd(listing.binPrice)}</dd>
            </>
          ) : null}
          {listing.estimatedMarketValue !== undefined ? (
            <>
              <dt className="text-muted-foreground">Market est.</dt>
              <dd className="text-right">{usd(listing.estimatedMarketValue)}</dd>
            </>
          ) : null}
          {listing.fees !== undefined ? (
            <>
              <dt className="text-muted-foreground">Fees</dt>
              <dd className="text-right">{usd(listing.fees)}</dd>
            </>
          ) : null}
          <dt className="text-muted-foreground">Timeline</dt>
          <dd className="text-right">{auctionTimeline(listing)}</dd>
        </dl>
      }
      actions={
        <SelectPathButton
          path="auction"
          listingId={listing.id}
          label="Open auction listing"
          onSelected={onSelected}
        />
      }
    />
  );
}
