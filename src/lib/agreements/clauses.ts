import { getDisclaimer, type DisclaimerKey } from "@/lib/legal/disclaimers";

export type AgreementClause = {
  id: string;
  title: string;
  body: string;
  disclaimerKey?: DisclaimerKey;
};

// picknbuild-path clauses. The AgreementDocument contract stores clause ids;
// the live copy lives in the legal disclaimer library so legal edits one
// surface.
export const PICKNBUILD_CLAUSES: AgreementClause[] = [
  {
    id: "clause.non-refundable",
    title: "Non-refundable deposit",
    body: getDisclaimer("non-refundable"),
    disclaimerKey: "non-refundable",
  },
  {
    id: "clause.insurance-required",
    title: "Insurance required prior to delivery",
    body: getDisclaimer("insurance"),
    disclaimerKey: "insurance",
  },
  {
    id: "clause.estimate",
    title: "Estimated pricing",
    body: getDisclaimer("estimate"),
    disclaimerKey: "estimate",
  },
  {
    id: "clause.financing",
    title: "Financing terms",
    body: getDisclaimer("financing"),
    disclaimerKey: "financing",
  },
];

export const PICKNBUILD_CLAUSE_IDS = PICKNBUILD_CLAUSES.map((c) => c.id);
