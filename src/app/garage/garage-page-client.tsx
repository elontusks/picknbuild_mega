"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  ConversionState,
  IntakeState,
  ListingObject,
  PathQuote,
  User,
} from "@/contracts";
import { IntakeProvider, useIntakeBaseline, useIntakeState } from "@/lib/intake";
import { quoteAllPaths } from "@/services/team-11-pricing";
import { applyIntakeFilterToEntries } from "@/lib/garage/filters";
import { computeHighlights } from "@/lib/garage/decision-highlights";
import type { GarageItem } from "@/lib/garage/store";
import { VehicleGroupingDisplay } from "@/components/garage/vehicle-grouping-display";
import { GarageComparisonTable } from "@/components/garage/comparison-table";
import { GarageFilterIntegration } from "@/components/garage/garage-filter-integration";

export type GarageSeed = {
  item: GarageItem;
  listing: ListingObject;
  conversionState: ConversionState;
};

type Props = {
  user: User;
  seeds: GarageSeed[];
};

export function GaragePageClient({ user, seeds }: Props) {
  return (
    <IntakeProvider user={user}>
      <GarageContainer user={user} seeds={seeds} />
    </IntakeProvider>
  );
}

function GarageContainer({ user, seeds }: Props) {
  const intake = useIntakeState();
  const baseline = useIntakeBaseline();

  const quoteMap = usePathQuoteMap(seeds, intake);

  const allEntries = useMemo(
    () =>
      seeds.map((s) => ({
        item: s.item,
        listing: s.listing,
        conversionState: s.conversionState,
        quotes: quoteMap[s.listing.id] ?? [],
      })),
    [seeds, quoteMap],
  );

  const filtered = useMemo(
    () => applyIntakeFilterToEntries(allEntries, intake),
    [allEntries, intake],
  );

  const { winners } = useMemo(
    () =>
      computeHighlights(
        filtered.map((e) => ({
          entryId: e.item.listingId,
          quotes: e.quotes,
        })),
      ),
    [filtered],
  );

  const rows = filtered.map((e) => ({
    entryId: e.item.listingId,
    listing: e.listing,
    quotes: e.quotes,
  }));

  // Intentionally two distinct zero-states:
  //   seeds.length === 0  → nothing ever saved. No intake filter context can
  //                         be responsible for the emptiness, so the filter
  //                         chrome is noise and we short-circuit to the
  //                         "save from search" empty-state.
  //   seeds.length  > 0 && filtered.length === 0 → user has saved vehicles
  //                         but current IntakeState hides them all. Filter
  //                         chrome stays visible so they can see (and adjust)
  //                         what's pruning the view.
  if (seeds.length === 0) {
    return (
      <section
        data-testid="garage-empty"
        className="mx-auto flex max-w-3xl flex-col items-center gap-3 rounded-xl border border-dashed border-border p-10 text-center-800"
      >
        <h2 className="text-lg font-semibold text-foreground">
          Your garage is empty.
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Save vehicles from Search or a listing detail page and they'll land
          here grouped by make and model, with all four paths priced side by
          side.
        </p>
      </section>
    );
  }

  return (
    <div data-testid="garage-container" className="flex flex-col gap-6">
      <GarageFilterIntegration
        intake={intake}
        baseline={baseline}
        visibleCount={filtered.length}
        totalCount={seeds.length}
      />
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Side-by-side
        </h2>
        <GarageComparisonTable rows={rows} winners={winners} />
      </section>
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Grouped by vehicle
        </h2>
        <VehicleGroupingDisplay
          entries={filtered}
          highlightWinners={winners}
          user={user}
          bestFitPreference={user.preferences.bestFit}
        />
      </section>
    </div>
  );
}

// Recomputes path quotes whenever the intake that drives pricing changes.
// Keyed on the subset of IntakeState that pricing actually reads so a
// make/model/title filter change doesn't re-fire pricing unnecessarily.
const usePathQuoteMap = (
  seeds: GarageSeed[],
  intake: IntakeState,
): Record<string, PathQuote[]> => {
  const [quotes, setQuotes] = useState<Record<string, PathQuote[]>>({});
  const intakeKey = useMemo(
    () =>
      JSON.stringify({
        zip: intake.location.zip,
        cash: intake.cash,
        cs: intake.creditScore ?? null,
        nc: intake.noCredit,
        term: intake.selectedTerm ?? null,
      }),
    [intake.location.zip, intake.cash, intake.creditScore, intake.noCredit, intake.selectedTerm],
  );
  const seedsKey = useMemo(
    () => seeds.map((s) => s.listing.id).join(","),
    [seeds],
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      seeds.map(async (seed) => {
        const rows = await quoteAllPaths(seed.listing, intake);
        return [seed.listing.id, rows] as const;
      }),
    )
      .then((pairs) => {
        if (cancelled) return;
        const next: Record<string, PathQuote[]> = {};
        for (const [id, rows] of pairs) next[id] = rows;
        setQuotes(next);
      })
      .catch(() => {
        if (cancelled) return;
        // Leave stale quotes rather than flashing empty rows on a transient
        // pricing error. The comparison table still renders with an em-dash.
      });
    return () => {
      cancelled = true;
    };
    // quoteAllPaths only depends on the stable slice captured by intakeKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedsKey, intakeKey]);

  return quotes;
};
