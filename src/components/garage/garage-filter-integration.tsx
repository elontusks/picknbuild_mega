"use client";

import Link from "next/link";
import type { IntakeState } from "@/contracts";
import { diffActiveFilters } from "@/lib/intake";

type Props = {
  intake: IntakeState;
  baseline: IntakeState;
  visibleCount: number;
  totalCount: number;
};

/**
 * Surfaces which IntakeState filters are currently pruning the garage and
 * links to /search where the buyer can widen them. We intentionally don't
 * offer an in-page "clear filters" button here — the filters belong to Team
 * 4's intake store, so the search page is the authoritative surface for
 * changing them.
 */
export function GarageFilterIntegration({
  intake,
  baseline,
  visibleCount,
  totalCount,
}: Props) {
  const active = diffActiveFilters(intake, baseline);
  const hasFilters = active.length > 0;
  const hidden = Math.max(0, totalCount - visibleCount);

  return (
    <div
      data-testid="garage-filter-integration"
      data-active-filter-count={active.length}
      className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground-800-900"
    >
      <span className="font-medium">
        {hasFilters
          ? `Filters active (${active.length}) · showing ${visibleCount} of ${totalCount}`
          : `Showing all ${totalCount} saved vehicle${totalCount === 1 ? "" : "s"}`}
      </span>
      {hidden > 0 ? (
        <span data-testid="garage-filter-hidden-count" className="text-muted-foreground">
          {hidden} hidden by intake
        </span>
      ) : null}
      {hasFilters ? (
        <Link
          data-testid="garage-filter-adjust"
          href="/browse"
          className="ml-auto inline-flex items-center rounded-md border border-border px-2 py-0.5 font-medium text-zinc-800 hover:bg-white-700 dark:hover:bg-muted"
        >
          Adjust filters
        </Link>
      ) : null}
    </div>
  );
}
