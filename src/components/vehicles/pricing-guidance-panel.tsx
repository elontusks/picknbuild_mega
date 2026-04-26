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
  low: "bg-emerald-100 text-emerald-800-900/40 dark:text-emerald-100",
  fair: "bg-muted text-zinc-800-800",
  high: "bg-amber-100 text-amber-800-900/40 dark:text-amber-100",
};

const usd = (n: number): string => `$${n.toLocaleString()}`;

export function PricingGuidancePanel({ guidance }: PricingGuidancePanelProps) {
  return (
    <section
      data-testid="pricing-guidance"
      data-verdict={guidance.verdict}
      aria-label="Pricing guidance"
      className="space-y-1 rounded-lg border border-border bg-background p-3-800-950"
    >
      <header className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">
          Pricing guidance
        </h3>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${VERDICT_CLASS[guidance.verdict]}`}
        >
          {VERDICT_LABEL[guidance.verdict]}
        </span>
      </header>
      <p className="text-xs text-muted-foreground">
        {guidance.reasonLine}
      </p>
      {guidance.marketRange ? (
        <p className="text-xs text-muted-foreground">
          Comparable listings:{" "}
          <span className="font-medium text-foreground">
            {usd(guidance.marketRange[0])}–{usd(guidance.marketRange[1])}
          </span>
        </p>
      ) : null}
      {guidance.negotiationAnchor !== undefined ? (
        <p className="text-xs text-muted-foreground">
          Consider starting at{" "}
          <span className="font-medium text-foreground">
            {usd(guidance.negotiationAnchor)}
          </span>
          .
        </p>
      ) : null}
    </section>
  );
}
