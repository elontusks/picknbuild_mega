import type { PathKind, PathQuote } from "@/contracts";
import { PATH_ORDER, PATH_TITLE, TERM_LABEL, pctLabel, usd } from "@/lib/compare/formatters";

type Props = {
  quotes: PathQuote[];
  /** Optional: highlight one cell per row as "best". */
  bestFitPath?: PathKind;
  /** Optional: caption above the row (e.g. "Accord · 58k mi"). */
  caption?: string;
};

const cell = (value: string | undefined) =>
  value === undefined ? "—" : value;

const monthlyCadence = (q: PathQuote): string | undefined => {
  if (q.path === "dealer" && q.monthly !== undefined) {
    return `${usd(q.monthly)}/mo`;
  }
  if (q.path === "picknbuild" && q.biweekly !== undefined) {
    return `${usd(q.biweekly)} biweekly`;
  }
  return undefined;
};

const aprCell = (q: PathQuote): string | undefined =>
  q.apr !== undefined ? pctLabel(q.apr) : undefined;

const termCell = (q: PathQuote): string | undefined =>
  q.term ? TERM_LABEL[q.term] : undefined;

/**
 * Tabular four-path row for a single vehicle. Reused by Garage's Comparison
 * Table — the shape is intentionally identical so either surface can swap
 * in the other's data.
 */
export function PathComparisonRow({ quotes, bestFitPath, caption }: Props) {
  const byPath = new Map<PathKind, PathQuote>(
    quotes.map((q) => [q.path, q]),
  );

  return (
    <div
      data-testid="path-comparison-row"
      className="overflow-x-auto rounded-lg border border-border-800"
    >
      {caption ? (
        <p className="border-b border-border bg-background px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground-800-900">
          {caption}
        </p>
      ) : null}
      <table className="w-full text-xs">
        <thead className="bg-background-900">
          <tr>
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
          {PATH_ORDER.map((path) => {
            const quote = byPath.get(path);
            const isBest = bestFitPath === path;
            const notApproved =
              quote?.path === "dealer" && quote.approvedBool === false;
            return (
              <tr
                key={path}
                data-testid={`path-row-${path}`}
                data-best-fit={isBest ? "true" : "false"}
                className={`border-t border-border-800 ${
                  isBest
                    ? "bg-emerald-50-950/30"
                    : ""
                }`}
              >
                <th
                  scope="row"
                  className="whitespace-nowrap px-3 py-1.5 text-left font-semibold text-foreground"
                >
                  {PATH_TITLE[path]}
                  {isBest ? (
                    <span className="ml-1 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-primary-foreground">
                      best
                    </span>
                  ) : null}
                </th>
                <td className="px-3 py-1.5 text-right">
                  {quote
                    ? notApproved
                      ? "Not approved"
                      : usd(quote.total)
                    : "—"}
                </td>
                <td className="px-3 py-1.5 text-right">
                  {cell(
                    quote?.down !== undefined ? usd(quote.down) : undefined,
                  )}
                </td>
                <td className="px-3 py-1.5 text-right">
                  {quote ? cell(monthlyCadence(quote)) : "—"}
                </td>
                <td className="px-3 py-1.5 text-right">
                  {quote ? cell(aprCell(quote)) : "—"}
                </td>
                <td className="px-3 py-1.5 text-right">
                  {quote ? cell(termCell(quote)) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
