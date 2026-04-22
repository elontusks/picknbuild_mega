/**
 * Centralized disclaimer copy. Other teams reference disclaimers by key so
 * legal can edit copy in one place without touching component trees.
 *
 * Source: original-spec/27-legal_disclaimers + chud copy notes referenced in
 * COMPONENTS.md "Legal Disclaimer Library" + ARCHITECTURE §2 cross-cutting
 * rules ("All-in pricing", non-refundable deposit).
 */
export const DISCLAIMER_KEYS = [
  "estimate",
  "financing",
  "non-refundable",
  "insurance",
  "clean-vs-rebuilt",
  "auction-diy",
  "wire-instructions",
] as const;

export type DisclaimerKey = (typeof DISCLAIMER_KEYS)[number];

const COPY: Record<DisclaimerKey, string> = {
  estimate:
    "All prices and payments shown are estimates. Final figures depend on inspection, taxes, fees, and credit approval at time of contract.",
  financing:
    "Financing terms shown are illustrative. picknbuild bi-weekly and dealer APR offers are subject to credit verification by the originating lender.",
  "non-refundable":
    "Your $1,000 picknbuild deposit is non-refundable once the agreement is signed. You may walk away from a build at any time, but the deposit will not be returned.",
  insurance:
    "Insurance is required before delivery on every picknbuild path. Proof of coverage must be provided prior to release of the vehicle.",
  "clean-vs-rebuilt":
    "Clean title means the vehicle has not been declared a total loss. Rebuilt title means the vehicle was declared a total loss and later reconstructed and inspected. Rebuilt vehicles are typically cheaper but may have insurance and resale limitations.",
  "auction-diy":
    "picknbuild does not bid on auctions on your behalf. The auction path is a comparison tool — you bid, win, and take delivery yourself.",
  "wire-instructions":
    "Wire instructions are unique per deal. Always confirm wire details by phone with picknbuild before sending funds. picknbuild will never change wire details by email.",
};

export function getDisclaimer(key: DisclaimerKey): string {
  return COPY[key];
}

export function listDisclaimers(): Array<{ key: DisclaimerKey; copy: string }> {
  return DISCLAIMER_KEYS.map((key) => ({ key, copy: COPY[key] }));
}
