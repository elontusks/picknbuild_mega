import "server-only";

import type { IntakeState, ListingObject, PathQuote } from "@/contracts";
import { getListing } from "@/services/team-03-supply";
import { quoteAllPaths } from "@/services/team-11-pricing";
import { getConversionState } from "@/services/team-12-workflows";
import type { ConversionState } from "@/contracts";
import { listGarageItems, type GarageItem } from "./store";
import { applyIntakeFilterToEntries } from "./filters";

export type HydratedGarageEntry = {
  item: GarageItem;
  listing: ListingObject;
  quotes: PathQuote[];
  conversionState: ConversionState;
};

export const hydrateGarageForUser = async (
  userId: string,
  intake: IntakeState,
): Promise<HydratedGarageEntry[]> => {
  const items = await listGarageItems(userId);
  if (items.length === 0) return [];

  const hydrated = await Promise.all(
    items.map(async (item) => {
      const listing = await getListing(item.listingId);
      if (!listing) return null;
      const [quotes, conversionState] = await Promise.all([
        quoteAllPaths(listing, intake),
        getConversionState({ userId, listingId: item.listingId }),
      ]);
      return { item, listing, quotes, conversionState };
    }),
  );
  const defined = hydrated.filter((h): h is HydratedGarageEntry => h !== null);
  return applyIntakeFilterToEntries(defined, intake);
};
