"use client";

import type { ListingObject } from "@/contracts";
import { CreditScoreInput } from "./credit-score-input";
import { CleanRebuiltToggle } from "./clean-rebuilt-toggle";
import { MatchModeToggle } from "./match-mode-toggle";
import { FilterPersistenceIndicator } from "./filter-persistence-indicator";
import { LinkParserInput } from "./link-parser-input";

type Props = {
  onParsedListing: (listing: ListingObject) => void;
};

/**
 * The always-visible bar across the top of the Search surface. Hosts the
 * credit input, title toggle, Match Mode, link parser, and the persistence
 * chip. No "Search" button — changes live-update IntakeState and downstream
 * surfaces react (§2 Live update principle).
 */
export function TopControlsBar({ onParsedListing }: Props) {
  return (
    <section
      data-shell-slot="intake-top-controls"
      data-intake="top-controls-bar"
      className="flex flex-col gap-4 border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-black md:px-6"
    >
      <div className="flex flex-wrap items-start gap-4">
        <CreditScoreInput />
        <CleanRebuiltToggle />
        <div className="flex flex-1 min-w-[260px] flex-col gap-2">
          <LinkParserInput onParsed={onParsedListing} />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MatchModeToggle />
        <FilterPersistenceIndicator />
      </div>
    </section>
  );
}
