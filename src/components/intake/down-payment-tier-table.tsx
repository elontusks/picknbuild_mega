"use client";

import { useIntakeState } from "@/lib/intake";
import { resolveDownPaymentPercentage } from "@/lib/pricing/credit-tier";

const ROWS: ReadonlyArray<{
  label: string;
  range: string;
  sample: { creditScore?: number; noCredit?: boolean };
}> = [
  { label: "No credit", range: "—", sample: { noCredit: true } },
  { label: "Sub-600", range: "< 600", sample: { creditScore: 599 } },
  { label: "600", range: "600", sample: { creditScore: 600 } },
  { label: "625", range: "625", sample: { creditScore: 625 } },
  { label: "650", range: "650", sample: { creditScore: 650 } },
  { label: "675", range: "675", sample: { creditScore: 675 } },
  { label: "700", range: "700", sample: { creditScore: 700 } },
  { label: "725", range: "725", sample: { creditScore: 725 } },
  { label: "750", range: "750", sample: { creditScore: 750 } },
  { label: "775", range: "775", sample: { creditScore: 775 } },
  { label: "800+", range: "800+", sample: { creditScore: 800 } },
];

/**
 * Reference card the buyer can eyeball to see where their score lands on the
 * picknbuild down-payment ladder (§5 Team 4). Read-only; highlights the row
 * matching the current IntakeState.creditScore / noCredit.
 */
export function DownPaymentTierTable() {
  const state = useIntakeState();
  const activeRow = pickActiveRow(state.creditScore, state.noCredit);

  return (
    <div
      data-intake="down-payment-tiers"
      className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3-800-900"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          picknbuild down-payment ladder
        </h4>
        <span className="text-xs text-muted-foreground">
          Floor 22% · Ceiling 12%
        </span>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase text-muted-foreground">
          <tr>
            <th className="py-1 pr-2 font-medium">Score</th>
            <th className="py-1 pr-2 font-medium">Down</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => {
            const pct = resolveDownPaymentPercentage(row.sample);
            const isActive = row.label === activeRow;
            return (
              <tr
                key={row.label}
                data-active={isActive || undefined}
                className={
                  isActive
                    ? "bg-muted text-foreground-800"
                    : "text-muted-foreground"
                }
              >
                <td className="py-1 pr-2 font-medium">{row.range}</td>
                <td className="py-1 pr-2 tabular-nums">
                  {(pct * 100).toFixed(1)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const pickActiveRow = (score?: number, noCredit?: boolean): string | null => {
  if (noCredit) return "No credit";
  if (score === undefined) return null;
  if (score < 600) return "Sub-600";
  if (score >= 800) return "800+";
  const anchors = [600, 625, 650, 675, 700, 725, 750, 775];
  let closest = anchors[0]!;
  for (const a of anchors) {
    if (Math.abs(score - a) < Math.abs(score - closest)) closest = a;
  }
  return String(closest);
};
