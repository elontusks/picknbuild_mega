import type { IntakeState, ListingObject, TitlePreference } from "@/contracts";

/**
 * §2 title-filter rule: "clean only" or "rebuilt only" hides listings whose
 * parsed title is neither. "both" (default) shows everything regardless.
 */
export const applyTitleFilter = (
  listings: ListingObject[],
  pref: TitlePreference,
): ListingObject[] => {
  if (pref === "both") return listings;
  if (pref === "clean") return listings.filter((l) => l.titleStatus === "clean");
  return listings.filter((l) => l.titleStatus === "rebuilt");
};

export type CreditBandDisplay = {
  label: string;
  tone: "green" | "yellow" | "red" | "locked";
  helper: string;
};

/**
 * UI-facing view of the credit-tier bands from lib/pricing/credit-tier. Kept
 * here (not in pricing) so the intake components don't depend on pricing's
 * internals — just the band + the copy to render.
 */
export const creditBandDisplay = ({
  creditScore,
  noCredit,
}: {
  creditScore?: number;
  noCredit: boolean;
}): CreditBandDisplay => {
  if (noCredit)
    return {
      label: "No credit",
      tone: "locked",
      helper: "picknbuild only · 22% down",
    };
  if (creditScore === undefined)
    return {
      label: "Credit unknown",
      tone: "locked",
      helper: "Enter a score or toggle No Credit",
    };
  if (creditScore < 600)
    return {
      label: "Sub-prime",
      tone: "locked",
      helper: "picknbuild only · 22% down",
    };
  if (creditScore < 650)
    return {
      label: "Red",
      tone: "red",
      helper: "High APR likely · picknbuild 20–22% down",
    };
  if (creditScore < 700)
    return {
      label: "Yellow",
      tone: "yellow",
      helper: "Mid APR · picknbuild 16–20% down",
    };
  return {
    label: "Green",
    tone: "green",
    helper: "Best APR tier · picknbuild 12–16% down",
  };
};

type FilterDiffField =
  | "make"
  | "model"
  | "yearRange"
  | "mileageMax"
  | "trim"
  | "titlePreference"
  | "matchMode";

/**
 * Which search-filter fields (not credit / cash) differ from baseline. Drives
 * the Filter Persistence Indicator chip — shows "3 filters active" etc.
 */
export const diffActiveFilters = (
  state: IntakeState,
  baseline: IntakeState,
): FilterDiffField[] => {
  const out: FilterDiffField[] = [];
  if ((state.make ?? "") !== (baseline.make ?? "")) out.push("make");
  if ((state.model ?? "") !== (baseline.model ?? "")) out.push("model");
  if (!sameRange(state.yearRange, baseline.yearRange)) out.push("yearRange");
  if ((state.mileageMax ?? null) !== (baseline.mileageMax ?? null))
    out.push("mileageMax");
  if ((state.trim ?? "") !== (baseline.trim ?? "")) out.push("trim");
  if (state.titlePreference !== baseline.titlePreference)
    out.push("titlePreference");
  if (state.matchMode !== baseline.matchMode) out.push("matchMode");
  return out;
};

const sameRange = (
  a?: [number, number],
  b?: [number, number],
): boolean => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a[0] === b[0] && a[1] === b[1];
};

/**
 * Build the query string we send to /api/listings. Title filter is handed to
 * the backend so "clean only" / "rebuilt only" lookups skip unknowns server-
 * side; "both" omits the param so the server returns everything.
 *
 * ZIP is intentionally NOT sent. `state.location.zip` is the user's profile
 * ZIP, used for distance display and pricing context — not as a hard filter.
 * The listings store does exact-match on `location_zip`, so passing it would
 * silently exclude every row not in that exact 5-digit code. Match Mode
 * (POST /api/search/match) handles geographic ranking separately.
 */
export const intakeToListingsQuery = (state: IntakeState): string => {
  const p = new URLSearchParams();
  if (state.make) p.set("make", state.make);
  if (state.model) p.set("model", state.model);
  if (state.yearRange) {
    p.set("yearMin", String(state.yearRange[0]));
    p.set("yearMax", String(state.yearRange[1]));
  }
  if (state.mileageMax !== undefined)
    p.set("mileageMax", String(state.mileageMax));
  if (state.titlePreference !== "both")
    p.set("titlePreference", state.titlePreference);
  p.set("limit", "24");
  return p.toString();
};
