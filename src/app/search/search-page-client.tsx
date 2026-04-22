"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { IntakeState, ListingObject, User } from "@/contracts";
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

type Props = { user: User };

export function SearchPageClient({ user }: Props) {
  return (
    <IntakeProvider user={user}>
      <TopControlsContainer />
    </IntakeProvider>
  );
}

function TopControlsContainer() {
  const [parsedListings, setParsedListings] = useState<ListingObject[]>([]);
  const onParsed = useCallback((listing: ListingObject) => {
    setParsedListings((prev) => [listing, ...prev.filter((l) => l.id !== listing.id)]);
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
        <ListingsPreview parsedListings={parsedListings} />
      </div>
    </>
  );
}

function ListingsPreview({
  parsedListings,
}: {
  parsedListings: ListingObject[];
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
          {filtered.map((l) => (
            <li
              key={l.id}
              data-listing-id={l.id}
              className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900"
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
            </li>
          ))}
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
