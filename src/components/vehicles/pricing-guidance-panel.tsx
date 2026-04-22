import type { PricingGuidance } from "@/services/team-11-intelligence";

type PricingGuidancePanelProps = {
  guidance: PricingGuidance;
};

const VERDICT_LABEL: Record<PricingGuidance["verdict"], string> = {
  low: "Below market",
  fair: "In range",
  high: "Above market",
};

const VERDICT_CLASS: Record<PricingGuidance["verdict"], string> = {
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100",
  fair: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100",
  high: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100",
};

const usd = (n: number): string => `$${n.toLocaleString()}`;

export function PricingGuidancePanel({ guidance }: PricingGuidancePanelProps) {
  return (
    <section
      data-testid="pricing-guidance"
      data-verdict={guidance.verdict}
      aria-label="Pricing guidance"
      className="space-y-1 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <header className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
          Pricing guidance
        </h3>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${VERDICT_CLASS[guidance.verdict]}`}
        >
          {VERDICT_LABEL[guidance.verdict]}
        </span>
      </header>
      <p className="text-xs text-zinc-600 dark:text-zinc-300">
        {guidance.reasonLine}
      </p>
      {guidance.marketRange ? (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
          Comparable listings:{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {usd(guidance.marketRange[0])}–{usd(guidance.marketRange[1])}
          </span>
        </p>
      ) : null}
      {guidance.negotiationAnchor !== undefined ? (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
          Consider starting at{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {usd(guidance.negotiationAnchor)}
          </span>
          .
        </p>
      ) : null}
    </section>
  );
}
