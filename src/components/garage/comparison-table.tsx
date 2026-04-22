import type { ListingObject, PathKind, PathQuote } from "@/contracts";
import {
  PATH_ORDER,
  PATH_TITLE,
  TERM_LABEL,
  pctLabel,
  usd,
} from "@/lib/compare/formatters";
import type { HighlightWinners } from "@/lib/garage/decision-highlights";

export type ComparisonRow = {
  entryId: string;
  listing: ListingObject;
  quotes: PathQuote[];
};

type Props = {
  rows: ComparisonRow[];
  winners: HighlightWinners;
};

const cell = (value: string | undefined): string => value ?? "—";

const cadenceCell = (q: PathQuote): string | undefined => {
  if (q.path === "dealer" && q.monthly !== undefined) return `${usd(q.monthly)}/mo`;
  if (q.path === "picknbuild" && q.biweekly !== undefined) {
    return `${usd(q.biweekly)} biweekly`;
  }
  return undefined;
};

const totalCell = (q: PathQuote): string =>
  q.path === "dealer" && q.approvedBool === false
    ? "Not approved"
    : usd(q.total);

const describeListing = (listing: ListingObject): string => {
  const base = `${listing.year} ${listing.make} ${listing.model}`;
  return listing.trim ? `${base} ${listing.trim}` : base;
};

/**
 * Side-by-side Garage comparison table. Column set intentionally matches the
 * four-path row (Team 5) so the garage reads like a roll-up of individual
 * rows: one row per vehicle × path pair, best-total and best-monthly cells
 * highlighted across the whole garage.
 */
export function GarageComparisonTable({ rows, winners }: Props) {
  if (rows.length === 0) {
    return (
      <p
        data-testid="garage-comparison-empty"
        className="rounded-md border border-dashed border-zinc-200 p-4 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
      >
        No saved vehicles yet — save a car from search or a listing page to
        compare side by side.
      </p>
    );
  }

  return (
    <div
      data-testid="garage-comparison-table"
      className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800"
    >
      <table className="w-full text-xs">
        <thead className="bg-zinc-50 dark:bg-zinc-900">
          <tr>
            <th scope="col" className="px-3 py-1.5 text-left">
              Vehicle
            </th>
            <th scope="col" className="px-3 py-1.5 text-left">
              Path
            </th>
            <th scope="col" className="px-3 py-1.5 text-right">
              All-in
            </th>
            <th scope="col" className="px-3 py-1.5 text-right">
              Down
            </th>
            <th scope="col" className="px-3 py-1.5 text-right">
              Cadence
            </th>
            <th scope="col" className="px-3 py-1.5 text-right">
              APR
            </th>
            <th scope="col" className="px-3 py-1.5 text-right">
              Term
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.flatMap((row) => {
            const byPath = new Map<PathKind, PathQuote>(
              row.quotes.map((q) => [q.path, q]),
            );
            return PATH_ORDER.map((path, pathIdx) => {
              const quote = byPath.get(path);
              const isTotalWinner =
                winners.lowestTotalEntryId === row.entryId &&
                !!quote &&
                !(quote.path === "dealer" && quote.approvedBool === false) &&
                winningTotal(quote, rows);
              const isMonthlyWinner =
                winners.lowestMonthlyEntryId === row.entryId &&
                !!quote &&
                winningMonthly(quote, rows);
              return (
                <tr
                  key={`${row.entryId}-${path}`}
                  data-testid={`garage-compare-row-${row.entryId}-${path}`}
                  className="border-t border-zinc-200 dark:border-zinc-800"
                >
                  {pathIdx === 0 ? (
                    <th
                      scope="rowgroup"
                      rowSpan={PATH_ORDER.length}
                      className="px-3 py-1.5 text-left align-top font-semibold text-zinc-900 dark:text-white"
                    >
                      {describeListing(row.listing)}
                    </th>
                  ) : null}
                  <td className="px-3 py-1.5 text-left">{PATH_TITLE[path]}</td>
                  <td
                    data-testid={`cell-total-${row.entryId}-${path}`}
                    data-winner={isTotalWinner ? "true" : "false"}
                    className={`px-3 py-1.5 text-right ${
                      isTotalWinner
                        ? "bg-emerald-100 font-semibold text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100"
                        : ""
                    }`}
                  >
                    {quote ? totalCell(quote) : "—"}
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    {cell(
                      quote?.down !== undefined ? usd(quote.down) : undefined,
                    )}
                  </td>
                  <td
                    data-testid={`cell-cadence-${row.entryId}-${path}`}
                    data-winner={isMonthlyWinner ? "true" : "false"}
                    className={`px-3 py-1.5 text-right ${
                      isMonthlyWinner
                        ? "bg-sky-100 font-semibold text-sky-900 dark:bg-sky-900/30 dark:text-sky-100"
                        : ""
                    }`}
                  >
                    {quote ? cell(cadenceCell(quote)) : "—"}
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    {cell(
                      quote?.apr !== undefined ? pctLabel(quote.apr) : undefined,
                    )}
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    {cell(quote?.term ? TERM_LABEL[quote.term] : undefined)}
                  </td>
                </tr>
              );
            });
          })}
        </tbody>
      </table>
    </div>
  );
}

// A quote is the total-winner only if its own total matches the minimum total
// we picked out for the winning entry — otherwise the highlight spreads across
// every path row of the winning vehicle, which hides which path actually won.
const winningTotal = (q: PathQuote, rows: ComparisonRow[]): boolean => {
  const approved = rows
    .flatMap((r) => r.quotes)
    .filter((candidate) => !(candidate.path === "dealer" && candidate.approvedBool === false))
    .map((candidate) => candidate.total);
  if (approved.length === 0) return false;
  const min = Math.min(...approved);
  return q.total === min && !(q.path === "dealer" && q.approvedBool === false);
};

const winningMonthly = (q: PathQuote, rows: ComparisonRow[]): boolean => {
  const monthlies: number[] = [];
  for (const r of rows) {
    for (const cand of r.quotes) {
      if (cand.path === "dealer") {
        if (cand.approvedBool === false) continue;
        if (cand.monthly !== undefined) monthlies.push(cand.monthly);
      } else if (cand.path === "picknbuild" && cand.biweekly !== undefined) {
        monthlies.push((cand.biweekly * 26) / 12);
      }
    }
  }
  if (monthlies.length === 0) return false;
  const min = Math.min(...monthlies);
  if (q.path === "dealer" && q.monthly !== undefined) return q.monthly === min;
  if (q.path === "picknbuild" && q.biweekly !== undefined) {
    return (q.biweekly * 26) / 12 === min;
  }
  return false;
};
