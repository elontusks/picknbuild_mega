import type { ConversionState, DealRecord } from "@/contracts";
import {
  DEAL_STATUS_FLOW,
  describeDealStatus,
  humanizeDealStatus,
} from "@/lib/dashboard/status-labels";
import { getDisclaimer } from "@/lib/legal/disclaimers";

type Props = {
  deal: DealRecord;
  // Only meaningful when the deal is anchored to a listing (dealer/private
  // seller/auction paths). Undefined for a pure picknbuild build.
  conversionState: ConversionState | null;
};

// Post-Conversion Status View.
//
// Per ARCHITECTURE §7 the auction path is DIY — there is no post-deposit
// "Auction Support Started" state. For the picknbuild path we render the
// DealRecord.status progression (build-started → sourcing → purchased →
// in-transit → delivered) as the canonical view. For external-signal paths
// (dealer lead / private seller invite) the deal still exists but the
// external state is owned by Team 12's dealer-lead / seller-invite flows;
// this surface renders the current ConversionState and otherwise defers to
// the relevant deal status.
export function PostConversionStatusView({ deal, conversionState }: Props) {
  // Heuristic for path: a DealRecord without a listingId can only come from
  // the picknbuild configurator flow (Team 9). With a listingId the deal
  // could be on any of the four paths; we show the generic picknbuild flow
  // because Teams 12/14 dispatch onDepositReceived for dealer paths as well.
  // Auction is the one deliberate exception: there is no post-deposit
  // picknbuild delivery flow for auctions, so we render the DIY handoff.
  const isAuction = isAuctionDeal(deal);

  if (isAuction) {
    return (
      <section
        data-testid="post-conversion-auction"
        className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <header className="mb-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Auction path
          </h2>
        </header>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          {getDisclaimer("auction-diy")}
        </p>
      </section>
    );
  }

  const currentIdx = DEAL_STATUS_FLOW.indexOf(deal.status);

  return (
    <section
      data-testid="post-conversion-picknbuild"
      className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <header className="mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Build progress
        </h2>
        <p className="mt-1 text-sm">
          <span
            data-testid="post-conversion-current-status"
            data-status={deal.status}
            className="font-medium"
          >
            {humanizeDealStatus(deal.status)}
          </span>
          <span className="block text-xs text-zinc-500">
            {describeDealStatus(deal.status)}
          </span>
        </p>
        {conversionState ? (
          <p
            data-testid="post-conversion-conversion-state"
            data-state={conversionState}
            className="mt-1 text-xs text-zinc-400"
          >
            Conversion state: {conversionState}
          </p>
        ) : null}
      </header>
      <ol
        data-testid="post-conversion-stages"
        className="space-y-1 text-sm"
      >
        {DEAL_STATUS_FLOW.map((stage, idx) => {
          const state =
            deal.status === stage
              ? "active"
              : idx < currentIdx
                ? "done"
                : "pending";
          return (
            <li
              key={stage}
              data-testid="post-conversion-stage"
              data-stage={stage}
              data-state={state}
              className={
                state === "done"
                  ? "text-zinc-500 line-through decoration-emerald-500"
                  : state === "active"
                    ? "font-medium text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-400"
              }
            >
              {humanizeDealStatus(stage)}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// A DealRecord's auction-path origin isn't stored on the record today; the
// configurator flow (Team 9) is picknbuild-only and dealer dispatch goes
// through the same onDepositReceived. v1 treats every DealRecord as a
// picknbuild build unless the committed spec's attachment list explicitly
// carries an "auction-*" marker — future Team 12 work can widen this.
function isAuctionDeal(deal: DealRecord): boolean {
  return (
    deal.committedSpec.attachments.some((a) => a.startsWith("auction-")) ||
    deal.committedSpec.customizations.includes("path:auction")
  );
}
