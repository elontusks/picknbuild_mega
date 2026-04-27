import type { ConversionState, PathQuote } from "@/contracts";
import { isLowBarrierEntry } from "@/lib/garage/decision-highlights";

type Props = {
  conversionState: ConversionState;
  quotes: PathQuote[];
  isLowestTotalInGarage: boolean;
  isLowestMonthlyInGarage: boolean;
};

/**
 * Renders the lightweight "review me" chips that sit on each Garage Item Card:
 *   - Best total $ across your saved cars
 *   - Best monthly cadence across your saved cars
 *   - Low barrier (any path requires ≤ $2k down and isn't dealer-denied)
 *   - Still deciding (ConversionState === "decided", not yet progressed)
 */
export function DecisionHighlightBadges({
  conversionState,
  quotes,
  isLowestTotalInGarage,
  isLowestMonthlyInGarage,
}: Props) {
  const lowBarrier = isLowBarrierEntry(quotes);
  const stillDeciding = conversionState === "decided";

  const badges: Array<{ key: string; label: string; tone: string }> = [];
  if (isLowestTotalInGarage) {
    badges.push({
      key: "lowest-total",
      label: "Best total $",
      tone: "bg-emerald-100 !text-black dark:bg-emerald-900 dark:!text-emerald-100",
    });
  }
  if (isLowestMonthlyInGarage) {
    badges.push({
      key: "lowest-monthly",
      label: "Best cadence",
      tone: "bg-sky-100 !text-black dark:bg-sky-900 dark:!text-sky-100",
    });
  }
  if (lowBarrier) {
    badges.push({
      key: "low-barrier",
      label: "Low barrier",
      tone: "bg-amber-100 !text-black dark:bg-amber-900 dark:!text-amber-100",
    });
  }
  if (stillDeciding) {
    badges.push({
      key: "still-deciding",
      label: "Still deciding",
      tone: "bg-muted text-muted-foreground-800",
    });
  }

  if (badges.length === 0) return null;

  return (
    <div
      data-testid="decision-highlight-badges"
      className="flex flex-wrap items-center gap-1"
    >
      {badges.map((b) => (
        <span
          key={b.key}
          data-testid={`decision-badge-${b.key}`}
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${b.tone}`}
          style={{ color: "#000000" }}
        >
          {b.label}
        </span>
      ))}
    </div>
  );
}
