import type { IntakeState, ListingObject, TitleStatus } from "@/contracts";
import { resolveDownPaymentPercentage } from "./credit-tier";

export type MatchModeScore = {
  listing: ListingObject;
  score: number;
  reasons: string[];
  disqualifiers: string[];
};

const titleMatches = (
  listingTitle: TitleStatus,
  pref: IntakeState["titlePreference"],
): boolean => {
  if (pref === "both") return true;
  return listingTitle === pref || listingTitle === "unknown";
};

const zipBucketMatches = (
  listingZip: string | undefined,
  userZip: string,
): boolean => {
  if (!listingZip) return true;
  return listingZip.slice(0, 1) === userZip.slice(0, 1);
};

const estimatePicknbuildDown = (listing: ListingObject, intake: IntakeState): number => {
  const base = listing.price ?? listing.binPrice ?? listing.currentBid ?? 20000;
  const pct = resolveDownPaymentPercentage({
    creditScore: intake.creditScore,
    noCredit: intake.noCredit,
  });
  return Math.round(base * pct);
};

export const scoreListingForIntake = (
  listing: ListingObject,
  intake: IntakeState,
): MatchModeScore => {
  const reasons: string[] = [];
  const disqualifiers: string[] = [];
  let score = 0;

  if (listing.status !== "active") {
    disqualifiers.push("Listing is not active.");
  }

  const down = estimatePicknbuildDown(listing, intake);
  if (down <= intake.cash) {
    reasons.push(`picknbuild down ($${down.toLocaleString()}) fits your cash.`);
    score += 3;
  } else {
    disqualifiers.push(
      `picknbuild down ($${down.toLocaleString()}) exceeds cash ($${intake.cash.toLocaleString()}).`,
    );
  }

  if (!titleMatches(listing.titleStatus, intake.titlePreference)) {
    disqualifiers.push(
      `Title (${listing.titleStatus}) doesn't match preference (${intake.titlePreference}).`,
    );
  } else if (intake.titlePreference !== "both" && listing.titleStatus === intake.titlePreference) {
    reasons.push(`Title matches your ${intake.titlePreference} preference.`);
    score += 1;
  }

  if (intake.make && listing.make.toLowerCase() === intake.make.toLowerCase()) {
    reasons.push("Make matches.");
    score += 1;
  }
  if (intake.model && listing.model.toLowerCase() === intake.model.toLowerCase()) {
    reasons.push("Model matches.");
    score += 1;
  }
  if (intake.yearRange) {
    const [minY, maxY] = intake.yearRange;
    if (listing.year >= minY && listing.year <= maxY) {
      reasons.push(`Year ${listing.year} is in your range.`);
      score += 1;
    } else {
      disqualifiers.push(`Year ${listing.year} outside ${minY}-${maxY}.`);
    }
  }
  if (intake.mileageMax !== undefined && listing.mileage !== undefined) {
    if (listing.mileage <= intake.mileageMax) {
      reasons.push(`Mileage ${listing.mileage.toLocaleString()} under cap.`);
      score += 1;
    } else {
      disqualifiers.push(
        `Mileage ${listing.mileage.toLocaleString()} over cap ${intake.mileageMax.toLocaleString()}.`,
      );
    }
  }

  if (zipBucketMatches(listing.locationZip, intake.location.zip)) {
    score += 0.5;
  }

  return { listing, score, reasons, disqualifiers };
};

export const matchListings = (
  listings: ListingObject[],
  intake: IntakeState,
): ListingObject[] => {
  if (!intake.matchMode) return listings;
  const scored = listings.map((l) => scoreListingForIntake(l, intake));
  return scored
    .filter((s) => s.disqualifiers.length === 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.listing);
};

export const explainMatch = (
  listing: ListingObject,
  intake: IntakeState,
): MatchModeScore => scoreListingForIntake(listing, intake);
