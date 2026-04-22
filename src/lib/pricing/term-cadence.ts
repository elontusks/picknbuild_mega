import type { Term } from "@/contracts";

export type FinancedTerm = Exclude<Term, "cash">;

const CADENCE: Record<FinancedTerm, number> = {
  "1y": 26,
  "2y": 52,
  "3y": 78,
  "4y": 104,
  "5y": 130,
};

export const termToBiweeklyCount = (term: FinancedTerm): number => CADENCE[term];

export const termToMonths = (term: FinancedTerm): number =>
  parseInt(term, 10) * 12;

export const isFinancedTerm = (term: Term | undefined): term is FinancedTerm =>
  term !== undefined && term !== "cash";
