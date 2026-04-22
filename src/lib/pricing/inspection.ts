import type { ListingObject } from "@/contracts";

export type InspectionSeverity = "low" | "med" | "high";
export type InspectionRecommendation = "proceed" | "negotiate" | "walk-away";
export type InspectionStatus =
  | "pending"
  | "scheduled"
  | "in-progress"
  | "completed"
  | "unavailable";

export type InspectionIssue = {
  severity: InspectionSeverity;
  note: string;
};

export type InspectionResult = {
  listingId: string;
  status: InspectionStatus;
  partnerName?: string;
  conditionSummary?: string;
  issues?: InspectionIssue[];
  recommendation?: InspectionRecommendation;
  confidence?: "low" | "med" | "high";
};

// Routing: auction + parsed-link always eligible for Option A on-demand inspection.
// Craigslist + user/private → Option C (remote review with photos/video).
// Dealer-posted listings in the MVP are low priority for inspection routing.
const PARTNER_BY_SOURCE: Record<ListingObject["source"], string> = {
  copart: "Lemon Squad — Auction Specialist",
  iaai: "Lemon Squad — Auction Specialist",
  craigslist: "Remote Review Partner (photo+video)",
  dealer: "Dealer-supplied condition report",
  user: "Remote Review Partner (photo+video)",
  "parsed-link": "Remote Review Partner (photo+video)",
};

export const routeInspection = (listing: ListingObject): InspectionResult => {
  const partnerName = PARTNER_BY_SOURCE[listing.source];
  const status: InspectionStatus = listing.source === "dealer" ? "unavailable" : "pending";
  return { listingId: listing.id, status, partnerName };
};

export const evaluateInspection = (result: InspectionResult): InspectionResult => {
  if (result.status !== "completed") return result;
  const worst = (result.issues ?? []).reduce<InspectionSeverity>(
    (s, i) => (sevWeight(i.severity) > sevWeight(s) ? i.severity : s),
    "low",
  );
  const recommendation: InspectionRecommendation =
    worst === "high" ? "walk-away" : worst === "med" ? "negotiate" : "proceed";
  return { ...result, recommendation };
};

const sevWeight = (s: InspectionSeverity): number =>
  s === "high" ? 3 : s === "med" ? 2 : 1;
