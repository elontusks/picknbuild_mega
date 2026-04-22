"use client";

import type { ListingObject } from "@/contracts";
import { applyTitleFilter, useIntakeState } from "@/lib/intake";

type Props = {
  listings: ListingObject[];
  children: (filtered: ListingObject[]) => React.ReactNode;
};

/**
 * Filter-only wrapper: applies IntakeState.titlePreference to the incoming
 * listing set and hands the result to the render-prop child. Keeping the
 * filter here (not inside every consumer) is the single enforcement point for
 * the §2 rule "clean only / rebuilt only hides unknown; both shows everything."
 */
export function TitlePreferenceFilter({ listings, children }: Props) {
  const state = useIntakeState();
  const filtered = applyTitleFilter(listings, state.titlePreference);
  return <>{children(filtered)}</>;
}
