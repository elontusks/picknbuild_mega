import type {
  BestFitPreference,
  IntakeState,
  ListingObject,
  PathKind,
  PathQuote,
} from "@/contracts";
import { listListings } from "./team-03-supply";
import {
  recommendBestPath as recommendBestPathCore,
  type RecommendationOutput,
} from "@/lib/pricing/recommendation";
import {
  getPricingGuidance as getPricingGuidanceCore,
  type PricingGuidance,
  type PricingGuidanceVerdict,
} from "@/lib/pricing/guidance";
import {
  evaluateInspection,
  routeInspection,
  type InspectionIssue,
  type InspectionRecommendation,
  type InspectionResult,
  type InspectionStatus,
} from "@/lib/pricing/inspection";
import { matchListings as matchListingsCore } from "@/lib/pricing/match-mode";
import {
  buildChecklist,
  setChecklistItem,
  type ChecklistItem,
  type ChecklistStage,
} from "@/lib/pricing/checklist";

export type {
  RecommendationOutput,
  PricingGuidance,
  PricingGuidanceVerdict,
  InspectionIssue,
  InspectionRecommendation,
  InspectionResult,
  InspectionStatus,
  ChecklistItem,
  ChecklistStage,
};

export const recommendBestPath = async (input: {
  intake: IntakeState;
  quotes: PathQuote[];
  bestFit?: BestFitPreference;
}): Promise<RecommendationOutput> =>
  recommendBestPathCore({
    intake: input.intake,
    quotes: input.quotes,
    bestFit: input.bestFit,
  });

export const getPricingGuidance = async (input: {
  listing: ListingObject;
  path: PathKind;
}): Promise<PricingGuidance> => getPricingGuidanceCore(input);

const INSPECTION_STORE: Map<string, InspectionResult> = new Map();

export const requestInspection = async (input: {
  listing?: ListingObject;
  listingId: string;
}): Promise<InspectionResult> => {
  const existing = INSPECTION_STORE.get(input.listingId);
  if (existing) return existing;
  if (input.listing) {
    const routed = routeInspection(input.listing);
    INSPECTION_STORE.set(input.listingId, routed);
    return routed;
  }
  const stub: InspectionResult = {
    listingId: input.listingId,
    status: "pending",
    partnerName: "Remote Review Partner (photo+video)",
  };
  INSPECTION_STORE.set(input.listingId, stub);
  return stub;
};

export const getInspectionResult = async (input: {
  listingId: string;
}): Promise<InspectionResult> => {
  const stored = INSPECTION_STORE.get(input.listingId);
  if (!stored) {
    return {
      listingId: input.listingId,
      status: "pending",
      partnerName: "Remote Review Partner (photo+video)",
    };
  }
  return evaluateInspection(stored);
};

export const submitInspectionResult = async (input: {
  listingId: string;
  status: InspectionStatus;
  conditionSummary?: string;
  issues?: InspectionIssue[];
  partnerName?: string;
}): Promise<InspectionResult> => {
  const result: InspectionResult = evaluateInspection({
    listingId: input.listingId,
    status: input.status,
    conditionSummary: input.conditionSummary,
    issues: input.issues,
    partnerName: input.partnerName,
    confidence: input.status === "completed" ? "med" : undefined,
  });
  INSPECTION_STORE.set(input.listingId, result);
  return result;
};

export const matchListings = async (
  intake: IntakeState,
): Promise<ListingObject[]> => {
  const enabled = { ...intake, matchMode: true };
  const pool = await listListings({
    make: intake.make,
    model: intake.model,
    yearRange: intake.yearRange,
    titleStatus:
      intake.titlePreference === "both" ? undefined : intake.titlePreference,
    locationZip: intake.location.zip,
    limit: 24,
  });
  return matchListingsCore(pool, enabled);
};

const CHECKLIST_STORE: Map<string, ChecklistItem[]> = new Map();

const checklistKey = (userId: string, listingId: string, path: PathKind) =>
  `${userId}:${listingId}:${path}`;

export const getChecklist = async (input: {
  path: PathKind;
  listingId: string;
  userId: string;
}): Promise<ChecklistItem[]> => {
  const key = checklistKey(input.userId, input.listingId, input.path);
  const existing = CHECKLIST_STORE.get(key);
  if (existing) return existing;
  const fresh = buildChecklist(input);
  CHECKLIST_STORE.set(key, fresh);
  return fresh;
};

export const updateChecklistItem = async (input: {
  userId: string;
  itemId: string;
  completed: boolean;
}): Promise<{ ok: true }> => {
  for (const [key, list] of CHECKLIST_STORE.entries()) {
    if (!key.startsWith(`${input.userId}:`)) continue;
    if (list.some((it) => it.id === input.itemId)) {
      CHECKLIST_STORE.set(key, setChecklistItem(list, input.itemId, input.completed));
      return { ok: true };
    }
  }
  return { ok: true };
};

export const _resetIntelligenceStoresForTests = () => {
  INSPECTION_STORE.clear();
  CHECKLIST_STORE.clear();
};
