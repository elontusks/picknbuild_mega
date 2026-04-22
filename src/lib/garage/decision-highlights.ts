import type { PathQuote } from "@/contracts";

export type HighlightFlag = "lowestTotal" | "lowestMonthly";

/**
 * Picks which path, across a collection of garage entries, wins each highlight
 * metric. Used by the Comparison Table to mark the best-of-garage cells.
 *
 * - `lowestTotal` tracks the cheapest all-in across every approved quote in
 *   every entry. Dealer rows flagged `approvedBool: false` are skipped.
 * - `lowestMonthly` compares monthly-equivalent cadences. Dealer monthly and
 *   picknbuild biweekly * 26 / 12 are both mapped onto a common monthly axis.
 */
export type EntryHighlight = {
  entryId: string;
  total?: number;
  monthly?: number;
};

export type HighlightWinners = {
  lowestTotalEntryId?: string;
  lowestMonthlyEntryId?: string;
};

export type HighlightInput = {
  entryId: string;
  quotes: PathQuote[];
};

const cheapestTotal = (quotes: PathQuote[]): number | undefined => {
  const candidates = quotes
    .filter((q) => !(q.path === "dealer" && q.approvedBool === false))
    .map((q) => q.total)
    .filter((n): n is number => Number.isFinite(n));
  if (candidates.length === 0) return undefined;
  return Math.min(...candidates);
};

const cheapestMonthly = (quotes: PathQuote[]): number | undefined => {
  const monthlies: number[] = [];
  for (const q of quotes) {
    if (q.path === "dealer") {
      if (q.approvedBool === false) continue;
      if (q.monthly !== undefined) monthlies.push(q.monthly);
    }
    if (q.path === "picknbuild" && q.biweekly !== undefined) {
      monthlies.push((q.biweekly * 26) / 12);
    }
  }
  if (monthlies.length === 0) return undefined;
  return Math.min(...monthlies);
};

export const computeHighlights = (
  rows: HighlightInput[],
): { perEntry: EntryHighlight[]; winners: HighlightWinners } => {
  const perEntry: EntryHighlight[] = rows.map((r) => {
    const entry: EntryHighlight = { entryId: r.entryId };
    const t = cheapestTotal(r.quotes);
    if (t !== undefined) entry.total = t;
    const m = cheapestMonthly(r.quotes);
    if (m !== undefined) entry.monthly = m;
    return entry;
  });
  const winners: HighlightWinners = {};
  const totals = perEntry.filter((e) => e.total !== undefined);
  if (totals.length > 0) {
    const winner = totals.reduce((acc, cur) =>
      (cur.total as number) < (acc.total as number) ? cur : acc,
    );
    winners.lowestTotalEntryId = winner.entryId;
  }
  const monthlies = perEntry.filter((e) => e.monthly !== undefined);
  if (monthlies.length > 0) {
    const winner = monthlies.reduce((acc, cur) =>
      (cur.monthly as number) < (acc.monthly as number) ? cur : acc,
    );
    winners.lowestMonthlyEntryId = winner.entryId;
  }
  return { perEntry, winners };
};

/**
 * The flip-side of decision highlights: a row qualifies for a "review me"
 * nudge when it hasn't progressed past `decided` and at least one of its path
 * quotes has a non-trivial barrier line the buyer hasn't cleared. The UI
 * surfaces this as a subdued chip so the buyer knows which saved cars still
 * need a call.
 */
export const isLowBarrierEntry = (quotes: PathQuote[]): boolean => {
  return quotes.some(
    (q) =>
      q.path !== "auction" &&
      !(q.path === "dealer" && q.approvedBool === false) &&
      typeof q.down === "number" &&
      q.down <= 2000,
  );
};
