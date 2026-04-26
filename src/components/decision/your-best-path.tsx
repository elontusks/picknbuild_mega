"use client";

import { useEffect, useMemo, useState } from "react";
import type { BestFitPreference, PathKind, PathQuote } from "@/contracts";
import {
  recommendBestPath,
  type RecommendationOutput,
} from "@/lib/pricing/recommendation";
import { useIntakeState } from "@/lib/intake";

const PATH_LABEL: Record<PathKind, string> = {
  dealer: "Dealer",
  picknbuild: "picknbuild",
  auction: "Auction",
  private: "Private seller",
};

type Props = {
  quotes: PathQuote[];
  bestFit?: BestFitPreference;
  onSelectPath?: (p: PathKind) => void;
};

/**
 * Your Best Path Right Now (ch/00, ch/06). Renders Team 11's recommendation
 * for the current IntakeState + four PathQuotes. Sticky card surfaced above
 * the See Where You Stand panel; the primary CTA points back into the
 * recommended path's card / configurator entry.
 */
export function YourBestPathRightNow({
  quotes,
  bestFit,
  onSelectPath,
}: Props) {
  const intake = useIntakeState();
  const [output, setOutput] = useState<RecommendationOutput | null>(null);
  const [loading, setLoading] = useState(false);

  const quotesKey = useMemo(
    () =>
      quotes
        .map(
          (q) =>
            `${q.path}:${q.total}:${q.down ?? "_"}:${q.biweekly ?? "_"}:${q.monthly ?? "_"}:${q.apr ?? "_"}:${q.term ?? "_"}:${q.approvedBool ?? "_"}:${q.titleStatus}`,
        )
        .join("|"),
    [quotes],
  );

  const intakeKey = useMemo(
    () =>
      JSON.stringify({
        cash: intake.cash,
        c: intake.creditScore ?? null,
        n: intake.noCredit,
        t: intake.titlePreference,
        bf: bestFit ?? null,
      }),
    [intake.cash, intake.creditScore, intake.noCredit, intake.titlePreference, bestFit],
  );

  useEffect(() => {
    if (quotes.length === 0) {
      // Render-time early-return handles the empty case; leaving a stale
      // `output` cached is fine because it's never shown.
      return;
    }
    setLoading(true);
    try {
      setOutput(recommendBestPath({ intake, quotes, bestFit }));
    } catch {
      setOutput(null);
    } finally {
      setLoading(false);
    }
    // intake/quotes/bestFit captured via memo keys so we don't thrash on
    // identity-only changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotesKey, intakeKey]);

  if (quotes.length === 0) {
    return (
      <aside
        data-decision="your-best-path"
        data-testid="your-best-path-empty"
        className="rounded-2xl border border-dashed border-border bg-background p-4 text-sm text-muted-foreground-800-950"
      >
        Pick a vehicle to see your best path right now.
      </aside>
    );
  }

  if (!output) {
    return (
      <aside
        data-decision="your-best-path"
        data-testid="your-best-path-loading"
        aria-busy={loading}
        className="rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground-800-950"
      >
        Calculating your best path…
      </aside>
    );
  }

  return (
    <aside
      data-decision="your-best-path"
      data-testid="your-best-path"
      data-recommended-path={output.recommendedPath}
      className="sticky top-2 z-10 flex flex-col gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 shadow-sm-700/60-950/40"
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            Your best path right now
          </p>
          <h2
            data-testid="best-path-name"
            className="text-lg font-semibold text-foreground"
          >
            {PATH_LABEL[output.recommendedPath]}
          </h2>
        </div>
        <button
          type="button"
          data-testid="best-path-cta"
          onClick={() => onSelectPath?.(output.recommendedPath)}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-emerald-700-500 dark:hover:bg-emerald-400"
        >
          {output.primaryCta.label}
        </button>
      </header>
      <p
        data-testid="best-path-reason"
        className="text-sm text-muted-foreground"
      >
        {output.reason}
      </p>
      {output.supportingBullets.length > 0 ? (
        <ul
          data-testid="best-path-bullets"
          className="ml-4 list-disc text-xs text-muted-foreground"
        >
          {output.supportingBullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      ) : null}
      {output.alternatives.length > 0 ? (
        <p
          data-testid="best-path-alternatives"
          className="text-xs text-muted-foreground"
        >
          Also worth considering:{" "}
          {output.alternatives.map((p) => PATH_LABEL[p]).join(" · ")}
        </p>
      ) : null}
    </aside>
  );
}
