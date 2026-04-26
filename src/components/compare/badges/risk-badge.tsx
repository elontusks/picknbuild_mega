import { resolveRiskLevel, type RiskLevel } from "@/lib/pricing/risk-band";

const RISK_LABEL: Record<RiskLevel, string> = {
  low: "Low risk",
  med: "Medium risk",
  high: "High risk",
};

const CHIP_CLASS: Record<RiskLevel, string> = {
  low: "bg-emerald-100 text-emerald-800-900/40 dark:text-emerald-100",
  med: "bg-amber-100 text-amber-800-900/40 dark:text-amber-100",
  high: "bg-rose-100 text-rose-800-900/40 dark:text-rose-100",
};

type Props = {
  creditScore?: number;
  noCredit?: boolean;
  className?: string;
};

export function RiskBadge({ creditScore, noCredit, className }: Props) {
  const level = resolveRiskLevel({ creditScore, noCredit });
  return (
    <span
      data-testid="risk-badge"
      data-risk-level={level}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${CHIP_CLASS[level]} ${className ?? ""}`}
    >
      {RISK_LABEL[level]}
    </span>
  );
}

export { resolveRiskLevel };
export type { RiskLevel };
