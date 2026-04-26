import { resolveRiskLevel, type RiskLevel } from "@/lib/pricing/risk-band";

const RISK_LABEL: Record<RiskLevel, string> = {
  low: "Low risk",
  med: "Medium risk",
  high: "High risk",
};

const CHIP_CLASS: Record<RiskLevel, string> = {
  low: "bg-emerald-400 text-emerald-950",
  med: "bg-amber-300 text-amber-900",
  high: "bg-rose-400 text-rose-950",
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
