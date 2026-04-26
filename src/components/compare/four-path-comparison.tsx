"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  BestFitPreference,
  IntakeState,
  ListingObject,
  PathKind,
  PathQuote,
} from "@/contracts";
import { BuildRecordProvider } from "@/lib/compare/build-record-store";
import { pickBestFitPath } from "@/lib/compare/best-fit";
import { applyTitleFilter } from "@/lib/intake";
import { DealerPathCard } from "./path-cards/dealer-path-card";
import { AuctionPathCard } from "./path-cards/auction-path-card";
import { PicknbuildPathCard } from "./path-cards/picknbuild-path-card";
import { PrivateSellerPathCard } from "./path-cards/private-path-card";
import { SponsorBoard } from "./sponsor-board";

type QuoteMap = Partial<Record<PathKind, PathQuote>>;

type FetchResult =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; quotes: QuoteMap };

type Props = {
  listing: ListingObject;
  intake: IntakeState;
  userId: string;
  bestFitPreference?: BestFitPreference;
  /** Injected quotes skip the fetch (tests / SSR). */
  initialQuotes?: PathQuote[];
};

async function fetchQuotes(
  listing: ListingObject,
  intake: IntakeState,
  signal: AbortSignal,
): Promise<PathQuote[]> {
  const res = await fetch("/api/pricing/quotes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listingId: listing.id, intake }),
    signal,
  });
  const body = (await res.json().catch(() => ({}))) as {
    quotes?: PathQuote[];
    error?: string;
  };
  if (!res.ok) throw new Error(body.error ?? "Pricing fetch failed");
  return body.quotes ?? [];
}

const quotesToMap = (rows: PathQuote[]): QuoteMap => {
  const map: QuoteMap = {};
  for (const q of rows) map[q.path] = q;
  return map;
};

/**
 * Top-level comparison surface: four path cards side-by-side for one listing.
 * Respects the title preference filter — if the listing's parsed title fails
 * the filter, we render nothing so Team 4's filter contract holds.
 *
 * Live updates: every change to the intake store re-fetches quotes (ARCH §2
 * "Live update principle").
 */
export function FourPathComparisonDisplay({
  listing,
  intake,
  userId,
  bestFitPreference = "lowestTotal",
  initialQuotes,
}: Props) {
  const filtered = useMemo(
    () => applyTitleFilter([listing], intake.titlePreference),
    [listing, intake.titlePreference],
  );

  const [fetchState, setFetchState] = useState<FetchResult>(() =>
    initialQuotes
      ? { status: "ready", quotes: quotesToMap(initialQuotes) }
      : { status: "loading" },
  );

  // fetchKey: any intake change that affects a PathQuote re-fires the fetch.
  const fetchKey = useMemo(
    () =>
      JSON.stringify({
        id: listing.id,
        sourceUpdated: listing.sourceUpdatedAt,
        creditScore: intake.creditScore ?? null,
        noCredit: intake.noCredit,
        titlePref: intake.titlePreference,
        cash: intake.cash,
        term: intake.selectedTerm ?? null,
        matchMode: intake.matchMode,
      }),
    [
      listing.id,
      listing.sourceUpdatedAt,
      intake.creditScore,
      intake.noCredit,
      intake.titlePreference,
      intake.cash,
      intake.selectedTerm,
      intake.matchMode,
    ],
  );

  useEffect(() => {
    if (initialQuotes) return;
    const controller = new AbortController();
    fetchQuotes(listing, intake, controller.signal)
      .then((rows) => {
        if (controller.signal.aborted) return;
        setFetchState({ status: "ready", quotes: quotesToMap(rows) });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setFetchState({
          status: "error",
          message: err instanceof Error ? err.message : "Pricing fetch failed",
        });
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey]);

  if (filtered.length === 0) {
    return (
      <section
        data-testid="four-path-filtered-out"
        className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground-700"
      >
        This listing&rsquo;s title ({listing.titleStatus}) doesn&rsquo;t match
        your title preference ({intake.titlePreference}).
      </section>
    );
  }

  if (fetchState.status === "loading") {
    return (
      <section
        data-testid="four-path-loading"
        className="rounded-md border border-border p-4 text-center text-sm text-muted-foreground-800"
      >
        Calculating paths…
      </section>
    );
  }

  if (fetchState.status === "error") {
    return (
      <section
        data-testid="four-path-error"
        className="rounded-md border border-rose-300 bg-rose-50 p-4 text-center text-sm text-rose-700-800-950/40 dark:text-rose-200"
      >
        Couldn&rsquo;t fetch path pricing: {fetchState.message}
      </section>
    );
  }

  const quotes = fetchState.quotes;
  const quoteList: PathQuote[] = [
    quotes.dealer,
    quotes.auction,
    quotes.picknbuild,
    quotes.private,
  ].filter((q): q is PathQuote => q !== undefined);
  const bestFit = pickBestFitPath(quoteList, bestFitPreference);

  return (
    <BuildRecordProvider userId={userId} listingId={listing.id}>
      <section
        data-testid="four-path-comparison"
        data-listing-id={listing.id}
        aria-label="Four-path comparison"
        className="flex flex-col gap-3"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {quotes.dealer ? (
            <div className="flex flex-col gap-2">
              <DealerPathCard
                listing={listing}
                intake={intake}
                quote={quotes.dealer}
                isBestFit={bestFit === "dealer"}
              />
              <SponsorBoard path="dealer" />
            </div>
          ) : null}
          {quotes.auction ? (
            <div className="flex flex-col gap-2">
              <AuctionPathCard
                listing={listing}
                intake={intake}
                quote={quotes.auction}
                isBestFit={bestFit === "auction"}
              />
              <SponsorBoard path="auction" />
            </div>
          ) : null}
          {quotes.picknbuild ? (
            <div className="flex flex-col gap-2">
              <PicknbuildPathCard
                listing={listing}
                intake={intake}
                quote={quotes.picknbuild}
                isBestFit={bestFit === "picknbuild"}
              />
              <SponsorBoard path="picknbuild" />
            </div>
          ) : null}
          {quotes.private ? (
            <div className="flex flex-col gap-2">
              <PrivateSellerPathCard
                listing={listing}
                intake={intake}
                quote={quotes.private}
                isBestFit={bestFit === "private"}
              />
              <SponsorBoard path="private" />
            </div>
          ) : null}
        </div>
      </section>
    </BuildRecordProvider>
  );
}
