"use client";

import type {
  BestFitPreference,
  User,
} from "@/contracts";
import type { HydratedGarageEntry } from "@/lib/garage/hydrate";
import { groupByYearMakeModel } from "@/lib/garage/grouping";
import type { HighlightWinners } from "@/lib/garage/decision-highlights";
import { GarageItemCard } from "./garage-item-card";

type Props = {
  entries: HydratedGarageEntry[];
  highlightWinners: HighlightWinners;
  user: User;
  bestFitPreference: BestFitPreference;
};

/**
 * Groups saved vehicles by Year-Make-Model and renders a GarageItemCard per
 * entry inside the group. Groups are ordered by first-seen so re-renders on
 * the same data don't reshuffle the layout.
 */
export function VehicleGroupingDisplay({
  entries,
  highlightWinners,
  user,
  bestFitPreference,
}: Props) {
  const groups = groupByYearMakeModel(entries);

  if (groups.length === 0) {
    return (
      <p
        data-testid="garage-grouping-empty"
        className="rounded-md border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
      >
        Nothing saved yet. Pick cars from search or the listing detail page to
        bring them into your garage.
      </p>
    );
  }

  return (
    <div data-testid="garage-grouping" className="flex flex-col gap-6">
      {groups.map((group) => (
        <section
          key={group.key}
          data-testid="garage-group"
          data-group-key={group.key}
          className="flex flex-col gap-3"
        >
          <header className="flex items-baseline justify-between">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              {group.label}
            </h3>
            <span className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {group.entries.length} saved
            </span>
          </header>
          <ul className="grid gap-3 md:grid-cols-2">
            {group.entries.map((entry) => (
              <li key={entry.item.listingId}>
                <GarageItemCard
                  listing={entry.listing}
                  quotes={entry.quotes}
                  conversionState={entry.conversionState}
                  decision={entry.item.decision}
                  userZip={user.zip}
                  {...(user.creditScore !== undefined
                    ? { userCreditScore: user.creditScore }
                    : {})}
                  {...(user.noCredit !== undefined
                    ? { userNoCredit: user.noCredit }
                    : {})}
                  bestFitPreference={bestFitPreference}
                  isLowestTotalInGarage={
                    highlightWinners.lowestTotalEntryId ===
                    entry.item.listingId
                  }
                  isLowestMonthlyInGarage={
                    highlightWinners.lowestMonthlyEntryId ===
                    entry.item.listingId
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
