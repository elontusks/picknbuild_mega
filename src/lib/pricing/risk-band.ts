import type { CreditTierInput } from "./credit-tier";

export type RiskLevel = "low" | "med" | "high";

export const resolveRiskLevel = ({
  creditScore,
  noCredit,
}: CreditTierInput): RiskLevel => {
  if (noCredit) return "high";
  if (creditScore === undefined) return "high";
  if (creditScore >= 700) return "low";
  if (creditScore >= 620) return "med";
  return "high";
};
