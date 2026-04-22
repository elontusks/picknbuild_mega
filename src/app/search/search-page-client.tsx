"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { IntakeState, ListingObject, PathQuote, User } from "@/contracts";
import {
  IntakeProvider,
  applyTitleFilter,
  intakeToListingsQuery,
  useIntakeState,
} from "@/lib/intake";
import {
  DownPaymentTierTable,
  SearchFilterControlPanel,
  TopControlsBar,
} from "@/components/intake";
import { FourPathComparisonDisplay } from "@/components/compare";
import {
  SeeWhereYouStandPanel,
  YourBestPathRightNow,
} from "@/components/decision";
import { quoteAllPaths } from "@/services/team-11-pricing";

type Props = { user: User };

export function SearchPageClient({ user }: Props) {
  return (
    <IntakeProvider user={user}>
      <TopControlsContainer user={user} />
    </IntakeProvider>
  );
}

function TopControlsContainer({ user }: { user: User }) {
  const [parsedListings, setParsedListings] = useState<ListingObject[]>([]);
  const [activeListing, setActiveListing] = useState<ListingObject | null>(null);

  const onParsed = useCallback((listing: ListingObject) => {
    setParsedListings((prev) => [listing, ...prev.filter((l) => l.id !== listing.id)]);
    setActiveListing(listing);
  }, []);

  return (
    <>
      <TopControlsBar onParsedListing={onParsed} />
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
        <section className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Search filters
            </h2>
            <SearchFilterControlPanel />
          </div>
          <div className="md:w-80">
            <DownPaymentTierTable />
          </div>
        </section>
        <ListingsPreview
          parsedListings={parsedListings}
          activeListingId={activeListing?.id ?? null}
          onSelectListing={setActiveListing}
        />
        <ComparePane user={user} listing={activeListing} />
        <DecisionSection listing={activeListing} user={user} />
      </div>
    </>
  );
}

function ComparePane({
  user,
  listing,
}: {
  user: User;
  listing: ListingObject | null;
}) {
  const intake = useIntakeState();
  if (!listing) {
    return (
      <section
        data-testid="compare-pane-empty"
        className="rounded-md border border-dashed border-zinc-200 p-4 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
      >
        Paste a link or pick a listing above to compare all four paths.
      </section>
    );
  }
  return (
    <section className="flex flex-col gap-3" data-testid="compare-pane">
      <header className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Four-path comparison
        </h2>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {listing.year} {listing.make} {listing.model}
          {listing.trim ? ` ${listing.trim}` : ""}
        </span>
      </header>
      <FourPathComparisonDisplay
        listing={listing}
        intake={intake}
        userId={user.id}
        bestFitPreference={user.preferences.bestFit}
      />
    </section>
  );
}

function DecisionSection({
  listing,
  user,
}: {
  listing: ListingObject | null;
  user: User;
}) {
  const intake = useIntakeState();
  const [quotes, setQuotes] = useState<PathQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intakeKey = useMemo(
    () =>
      JSON.stringify({
        zip: intake.location.zip,
        cash: intake.cash,
        cs: intake.creditScore ?? null,
        nc: intake.noCredit,
        title: intake.titlePreference,
        term: intake.selectedTerm ?? null,
      }),
    [intake],
  );

  useEffect(() => {
    if (!listing) {
      // Displayed quotes derive from `listing` below, so there's no stale-
      // render risk leaving the cached `quotes` alone when focus clears.
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    quoteAllPaths(listing, intake)
      .then((rows) => {
        if (cancelled) return;
        setQuotes(rows);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to price paths");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // intake captured via stable key; listing identity gates the fetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing?.id, intakeKey]);

  // Derive displayed quotes so that clearing focus instantly empties the
  // decision surfaces without needing a setState-in-effect to clear `quotes`.
  const displayedQuotes = listing ? quotes : [];

  return (
    <section
      data-section="decision"
      className="grid gap-4 lg:grid-cols-[1fr_2fr]"
    >
      <YourBestPathRightNow
        quotes={displayedQuotes}
        bestFit={user.preferences.bestFit}
      />
      <div className="flex flex-col gap-3">
        {loading ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Pricing all four paths…
          </p>
        ) : null}
        {error ? (
          <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
        ) : null}
        <SeeWhereYouStandPanel
          quotes={displayedQuotes}
          listing={listing ?? undefined}
        />
      </div>
    </section>
  );
}

function ListingsPreview({
  parsedListings,
  activeListingId,
  onSelectListing,
}: {
  parsedListings: ListingObject[];
  activeListingId: string | null;
  onSelectListing: (listing: ListingObject) => void;
}) {
  const state = useIntakeState();
  const [listings, setListings] = useState<ListingObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  const queryKey = useMemo(() => buildQueryKey(state), [state]);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    fetchForIntake(stateRef.current, controller.signal)
      .then((rows) => {
        if (id !== reqId.current) return;
        setListings(rows);
      })
      .catch((err: unknown) => {
        if (id !== reqId.current) return;
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load listings");
      })
      .finally(() => {
        if (id !== reqId.current) return;
        setLoading(false);
      });
    return () => controller.abort();
  }, [queryKey]);

  const filtered = applyTitleFilter(
    [...parsedListings, ...listings],
    state.titlePreference,
  );

  // Auto-select the first visible listing so the Compare + Decision panels
  // always have a vehicle to render against on first load. Only fires when
  // nothing is active yet — user clicks take precedence.
  useEffect(() => {
    if (activeListingId !== null) return;
    const first = filtered[0];
    if (first) onSelectListing(first);
    // Identity-only changes from new fetches shouldn't re-trigger
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered.map((l) => l.id).join(","), activeListingId]);

  return (
    <section className="flex flex-col gap-3" data-intake="listings-preview">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {state.matchMode ? "Match Mode results" : "Matching listings"}
        </h2>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {loading ? "Loading…" : `${filtered.length} listing${filtered.length === 1 ? "" : "s"}`}
        </span>
      </header>
      {error ? (
        <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
      ) : null}
      {filtered.length === 0 && !loading ? (
        <p className="rounded-xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          No listings match yet. Try widening your filters or pasting a URL
          above.
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l) => {
            const active = activeListingId === l.id;
            return (
              <li key={l.id} data-listing-id={l.id}>
                <button
                  type="button"
                  onClick={() => onSelectListing(l)}
                  data-testid={`listing-tile-${l.id}`}
                  data-active={active ? "true" : "false"}
                  aria-pressed={active}
                  className={`flex w-full flex-col gap-1 rounded-xl border p-4 text-left text-sm transition ${
                    active
                      ? "border-emerald-400 bg-emerald-50 dark:border-emerald-500/60 dark:bg-emerald-950/30"
                      : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-900 dark:text-white">
                      {l.year || "—"} {l.make} {l.model}
                    </span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {l.source}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                    {l.mileage !== undefined ? (
                      <span>{l.mileage.toLocaleString()} mi</span>
                    ) : null}
                    {l.price !== undefined ? (
                      <span>${l.price.toLocaleString()}</span>
                    ) : null}
                    {l.locationZip ? <span>ZIP {l.locationZip}</span> : null}
                    <span>Title: {l.titleStatus}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

const buildQueryKey = (state: IntakeState): string => {
  // Invalidation key — if any of these change, we re-fetch. cash/creditScore/
  // noCredit are IntakeState too but don't gate the listing query; they're
  // pricing-side only.
  return JSON.stringify({
    q: intakeToListingsQuery(state),
    match: state.matchMode,
    score: state.creditScore ?? null,
    noCredit: state.noCredit,
    cash: state.cash,
  });
};

const fetchForIntake = async (
  state: IntakeState,
  signal: AbortSignal,
): Promise<ListingObject[]> => {
  if (state.matchMode) {
    const res = await fetch("/api/search/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intake: state }),
      signal,
    });
    const body = (await res.json().catch(() => ({}))) as {
      listings?: ListingObject[];
      error?: string;
    };
    if (!res.ok) throw new Error(body.error ?? "Match failed");
    return body.listings ?? [];
  }
  const qs = intakeToListingsQuery(state);
  const res = await fetch(`/api/listings?${qs}`, { signal });
  const body = (await res.json().catch(() => ({}))) as {
    listings?: ListingObject[];
    error?: string;
  };
  if (!res.ok) throw new Error(body.error ?? "Listing fetch failed");
  return body.listings ?? [];
};
