import type { PathKind, Term } from "@/contracts";

export const PATH_ORDER: PathKind[] = [
  "dealer",
  "auction",
  "picknbuild",
  "private",
];

export const PATH_TITLE: Record<PathKind, string> = {
  dealer: "Dealer",
  auction: "Auction",
  picknbuild: "picknbuild",
  private: "Private seller",
};

export const PATH_SUBTITLE: Record<PathKind, string> = {
  dealer: "Financed at a dealership",
  auction: "DIY auction purchase",
  picknbuild: "Commit and let us build it",
  private: "Buy direct from owner",
};

export const TERM_LABEL: Record<Term, string> = {
  cash: "Cash",
  "1y": "1 yr",
  "2y": "2 yr",
  "3y": "3 yr",
  "4y": "4 yr",
  "5y": "5 yr",
};

export const usd = (n: number): string =>
  `$${Math.round(n).toLocaleString()}`;

export const pctLabel = (n: number, digits = 1): string =>
  `${(n * 100).toFixed(digits)}%`;
