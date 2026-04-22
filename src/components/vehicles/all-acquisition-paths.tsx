import type { PathKind, PathQuote, Term } from "@/contracts";

const PATH_ORDER: PathKind[] = ["dealer", "auction", "picknbuild", "private"];

const PATH_TITLE: Record<PathKind, string> = {
  dealer: "Dealer",
  auction: "Auction",
  picknbuild: "picknbuild",
  private: "Private seller",
};

const PATH_SUBTITLE: Record<PathKind, string> = {
  dealer: "Financed at a dealership",
  auction: "DIY auction purchase",
  picknbuild: "Commit and let us build it",
  private: "Buy direct from owner",
};

const TERM_LABEL: Record<Term, string> = {
  cash: "Cash",
  "1y": "1 yr",
  "2y": "2 yr",
  "3y": "3 yr",
  "4y": "4 yr",
  "5y": "5 yr",
};

const usd = (n: number): string => `$${n.toLocaleString()}`;

const allInLine = (q: PathQuote): string => {
  const base = `All-in ${usd(q.total)}`;
  if (q.path === "picknbuild" && q.biweekly !== undefined) {
    return `${base} · ${usd(q.biweekly)} biweekly${q.term ? ` (${TERM_LABEL[q.term]})` : ""}`;
  }
  if (q.path === "dealer" && q.monthly !== undefined) {
    const apr = q.apr !== undefined ? ` @ ${(q.apr * 100).toFixed(1)}% APR` : "";
    return `${base} · ${usd(q.monthly)}/mo${apr}${q.term ? ` (${TERM_LABEL[q.term]})` : ""}`;
  }
  if (q.path === "auction") {
    return `${base} estimated`;
  }
  return `${base}`;
};

type AllAcquisitionPathsProps = {
  quotes: PathQuote[];
  listingId: string;
  bestFitPath?: PathKind;
  actionsByPath?: Partial<Record<PathKind, React.ReactNode>>;
};

export function AllAcquisitionPaths({
  quotes,
  listingId,
  bestFitPath,
  actionsByPath,
}: AllAcquisitionPathsProps) {
  const quoteByPath = new Map<PathKind, PathQuote>(
    quotes.map((q) => [q.path, q]),
  );
  return (
    <section
      data-testid="all-acquisition-paths"
      data-listing-id={listingId}
      aria-label="All acquisition paths"
      className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
    >
      {PATH_ORDER.map((path) => {
        const quote = quoteByPath.get(path);
        if (!quote) return null;
        const notApproved =
          path === "dealer" && quote.approvedBool === false;
        return (
          <div
            key={path}
            data-testid={`path-card-${path}`}
            className={`flex flex-col gap-2 rounded-xl border p-3 ${
              bestFitPath === path
                ? "border-emerald-400 bg-emerald-50 dark:border-emerald-500/60 dark:bg-emerald-950/30"
                : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
            }`}
          >
            <header className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
                  {PATH_TITLE[path]}
                </h3>
                <p className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {PATH_SUBTITLE[path]}
                </p>
              </div>
              {bestFitPath === path ? (
                <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                  Best fit
                </span>
              ) : null}
            </header>
            <p className="text-sm text-zinc-700 dark:text-zinc-200">{allInLine(quote)}</p>
            {quote.down !== undefined ? (
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                Down {usd(quote.down)}
              </p>
            ) : null}
            <p
              data-testid={`barrier-${path}`}
              className="text-xs leading-5 text-zinc-600 dark:text-zinc-300"
            >
              {quote.barrierLine}
            </p>
            {notApproved ? (
              <p
                data-testid="not-approved"
                className="rounded bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 dark:bg-rose-950/50 dark:text-rose-200"
              >
                Credit tier doesn&apos;t meet this dealer path right now.
              </p>
            ) : null}
            {actionsByPath?.[path] ? (
              <div className="pt-1">{actionsByPath[path]}</div>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}
