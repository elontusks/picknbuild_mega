import type { IntakeState, ListingObject } from "@/contracts";

export type IntakeFilterableEntry = {
  listing: ListingObject;
};

/**
 * Applies the buyer's active IntakeState filters to a saved-vehicle set. Rules
 * mirror §2 of ARCHITECTURE: title preference hides listings whose parsed title
 * is neither clean nor rebuilt when the user has chosen a single side. Other
 * intake fields (make/model/year/mileage) are additive — they prune the garage
 * to what still matches the buyer's current search so the comparison surface
 * stays coherent.
 */
export const applyIntakeFilterToEntries = <T extends IntakeFilterableEntry>(
  entries: T[],
  intake: IntakeState,
): T[] => {
  return entries.filter(({ listing }) => {
    if (intake.titlePreference !== "both") {
      if (listing.titleStatus !== intake.titlePreference) return false;
    }
    if (intake.make && intake.make.trim().length > 0) {
      if (listing.make.toLowerCase() !== intake.make.trim().toLowerCase()) {
        return false;
      }
    }
    if (intake.model && intake.model.trim().length > 0) {
      if (listing.model.toLowerCase() !== intake.model.trim().toLowerCase()) {
        return false;
      }
    }
    if (intake.yearRange) {
      const [lo, hi] = intake.yearRange;
      if (listing.year < lo || listing.year > hi) return false;
    }
    if (intake.mileageMax !== undefined && listing.mileage !== undefined) {
      if (listing.mileage > intake.mileageMax) return false;
    }
    return true;
  });
};
