import type { BestFitPreference, PathKind, PathQuote } from "@/contracts";

const PATH_ORDER: PathKind[] = ["dealer", "auction", "picknbuild", "private"];

const candidate = (q: PathQuote): boolean => q.approvedBool !== false;

const monthlyEquivalent = (q: PathQuote): number | undefined => {
  if (q.path === "dealer" && q.monthly !== undefined) return q.monthly;
  if (q.path === "picknbuild" && q.biweekly !== undefined) {
    return Math.round(q.biweekly * (26 / 12));
  }
  return undefined;
};

/**
 * Picks the "Best Fit" path according to the user's preference.
 *
 * - lowestTotal: minimum all-in (PathQuote.total) across approved paths.
 * - lowestMonthly: minimum monthly-equivalent across approved paths that
 *   have a monthly cadence (dealer.monthly, picknbuild.biweekly scaled).
 *   Auction and private don't expose a monthly cadence and are excluded.
 *
 * Returns undefined if no approved path qualifies. Ties break by PATH_ORDER.
 */
export const pickBestFitPath = (
  quotes: PathQuote[],
  preference: BestFitPreference = "lowestTotal",
): PathKind | undefined => {
  const approved = quotes.filter(candidate);
  if (approved.length === 0) return undefined;

  const sorted = [...approved].sort((a, b) => {
    if (preference === "lowestMonthly") {
      const aM = monthlyEquivalent(a);
      const bM = monthlyEquivalent(b);
      if (aM === undefined && bM === undefined) {
        return a.total - b.total;
      }
      if (aM === undefined) return 1;
      if (bM === undefined) return -1;
      if (aM !== bM) return aM - bM;
    }
    if (a.total !== b.total) return a.total - b.total;
    return PATH_ORDER.indexOf(a.path) - PATH_ORDER.indexOf(b.path);
  });

  return sorted[0]?.path;
};
