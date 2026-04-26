"use client";

import { useEffect, useMemo } from "react";
import type { ListingObject, PathKind, PathQuote } from "@/contracts";
import { useAutoCycle } from "@/lib/decision";
import { ChooseYourTerm } from "./choose-your-term";
import { PathToggleGapView } from "./path-toggle";
import { DealerGapModule } from "./dealer-gap-module";
import { PicknbuildGapModule } from "./picknbuild-gap-module";
import { AuctionGapModule } from "./auction-gap-module";
import { PrivateGapModule } from "./private-gap-module";

const FALLBACK_ORDER: PathKind[] = ["dealer", "picknbuild", "auction", "private"];

type Props = {
  quotes: PathQuote[];
  listing?: ListingObject;
  initialPath?: PathKind;
  /** Disable the auto-cycle in tests / specific contexts. */
  autoCycle?: boolean;
  cycleIntervalMs?: number;
};

/**
 * See Where You Stand Panel (ch/00, ch/06, ch/08, ch/09). Renders Choose Your
 * Term + the path toggle (with auto-cycle) + the active gap-logic module.
 * The active module embeds the Buying Power layer so the buyer can see at a
 * glance how their cash compares to that path's all-in total.
 */
export function SeeWhereYouStandPanel({
  quotes,
  listing,
  initialPath,
  autoCycle = true,
  cycleIntervalMs,
}: Props) {
  const available = useMemo(
    () => FALLBACK_ORDER.filter((p) => quotes.some((q) => q.path === p)),
    [quotes],
  );
  const fallbackInitial: PathKind = available[0] ?? "picknbuild";
  const startPath = initialPath ?? fallbackInitial;

  const { activePath, setActivePath, stopped } = useAutoCycle(
    available,
    startPath,
    { intervalMs: cycleIntervalMs, enabled: autoCycle && available.length > 1 },
  );

  // If the active path drops out of the quote set (e.g. a refetch removes a
  // path), snap back to the first available so the panel never renders empty.
  useEffect(() => {
    if (available.length === 0) return;
    if (!available.includes(activePath)) {
      const first = available[0];
      if (first) setActivePath(first);
    }
    // setActivePath is stable from the hook; don't include to avoid loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [available.join(","), activePath]);

  const activeQuote = quotes.find((q) => q.path === activePath);

  if (quotes.length === 0 || !activeQuote) {
    return (
      <section
        data-decision="see-where-you-stand"
        data-testid="see-where-you-stand-empty"
        className="rounded-2xl border border-dashed border-border bg-background p-4 text-sm text-muted-foreground-800-950"
      >
        Pick a vehicle to see where you stand on each path.
      </section>
    );
  }

  // Term selector only matters for financed paths (dealer, picknbuild). Auction
  // and Private are cash-only — keep it visible but disabled so the user knows
  // it's intentional, not broken.
  const termEnabled = activePath === "dealer" || activePath === "picknbuild";

  return (
    <section
      data-decision="see-where-you-stand"
      data-testid="see-where-you-stand"
      data-active-path={activePath}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-4-800-950"
    >
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-foreground">
            See where you stand
          </h2>
          <ChooseYourTerm enabled={termEnabled} />
        </div>
        <PathToggleGapView
          activePath={activePath}
          quotes={quotes}
          onChange={setActivePath}
          autoCycleStopped={stopped}
        />
      </header>
      <div data-decision="active-gap-module">
        {activePath === "dealer" ? (
          <DealerGapModule quote={activeQuote} />
        ) : null}
        {activePath === "picknbuild" ? (
          <PicknbuildGapModule quote={activeQuote} />
        ) : null}
        {activePath === "auction" ? (
          <AuctionGapModule quote={activeQuote} listing={listing} />
        ) : null}
        {activePath === "private" ? (
          <PrivateGapModule quote={activeQuote} listing={listing} />
        ) : null}
      </div>
    </section>
  );
}
