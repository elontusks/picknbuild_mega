import {
  makeFixtureListingObject,
  type IntakeState,
  type ListingObject,
  type PathKind,
  type PathQuote,
} from "@/contracts";

export type RecommendationOutput = {
  recommendedPath: PathKind;
  reason: string;
  supportingBullets: string[];
  alternatives: PathKind[];
  primaryCta: { label: string; href: string };
};

export const recommendBestPath = async (input: {
  intake: IntakeState;
  quotes: PathQuote[];
}): Promise<RecommendationOutput> => {
  const pick = input.quotes.reduce<PathQuote | null>((best, q) => {
    if (q.approvedBool === false) return best;
    if (!best) return q;
    return q.total < best.total ? q : best;
  }, null);
  const path = pick?.path ?? "picknbuild";
  return {
    recommendedPath: path,
    reason:
      path === "picknbuild"
        ? "Your credit + cash line up cleanly with our Standard package."
        : `Lowest all-in total among the four paths for your profile.`,
    supportingBullets: [
      "Meets your cash-on-hand",
      "Matches your title preference",
      "Approved under your credit tier",
    ],
    alternatives: input.quotes.map((q) => q.path).filter((p) => p !== path),
    primaryCta: { label: "See Where You Stand", href: "#see-where-you-stand" },
  };
};

export type PricingGuidanceVerdict = "low" | "fair" | "high";
export type PricingGuidance = {
  verdict: PricingGuidanceVerdict;
  reasonLine: string;
  marketRange?: [number, number];
  negotiationAnchor?: number;
};

export const getPricingGuidance = async (input: {
  listing: ListingObject;
  path: PathKind;
}): Promise<PricingGuidance> => ({
  verdict: "fair",
  reasonLine: "Priced within $400 of comparable listings in your area.",
  marketRange: [
    Math.round((input.listing.price ?? 20000) * 0.9),
    Math.round((input.listing.price ?? 20000) * 1.1),
  ],
  negotiationAnchor: Math.round((input.listing.price ?? 20000) * 0.94),
});

export type InspectionResult = {
  status: "pending" | "completed";
  conditionSummary?: string;
  issues?: { severity: "low" | "med" | "high"; note: string }[];
  recommendation?: "proceed" | "negotiate" | "walk-away";
};

export const requestInspection = async (input: {
  listingId: string;
}): Promise<InspectionResult> => ({ status: "pending" });

export const getInspectionResult = async (input: {
  listingId: string;
}): Promise<InspectionResult> => ({
  status: "completed",
  conditionSummary: "Overall good. Minor cosmetic wear, runs clean.",
  issues: [{ severity: "low", note: "Small dent in rear quarter panel." }],
  recommendation: "proceed",
});

export const matchListings = async (
  intake: IntakeState,
): Promise<ListingObject[]> => {
  // Filter to listings that fit the cash+credit+title+location reality.
  return Array.from({ length: 6 }, () =>
    makeFixtureListingObject({
      make: intake.make ?? "Honda",
      model: intake.model ?? "Accord",
      titleStatus:
        intake.titlePreference === "both" ? "clean" : intake.titlePreference,
    }),
  );
};

export type ChecklistItem = {
  id: string;
  label: string;
  stage: string;
  completed: boolean;
};

export const getChecklist = async (input: {
  path: PathKind;
  listingId: string;
  userId: string;
}): Promise<ChecklistItem[]> => [
  { id: "c1", label: "Review listing details", stage: "discover", completed: true },
  { id: "c2", label: "Compare all four paths", stage: "compare", completed: false },
  { id: "c3", label: "Run pricing guidance", stage: "compare", completed: false },
  { id: "c4", label: "Request inspection (if offered)", stage: "verify", completed: false },
  { id: "c5", label: "Commit to a path", stage: "commit", completed: false },
];

export const updateChecklistItem = async (input: {
  userId: string;
  itemId: string;
  completed: boolean;
}): Promise<{ ok: true }> => ({ ok: true });
