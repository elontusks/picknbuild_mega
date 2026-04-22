import "server-only";

import {
  getGarageItem,
  listGarageItems,
  removeGarageItem,
  saveGarageItem,
  setGarageDecision,
  type GarageDecision,
  type GarageItem,
  type SaveGarageInput,
} from "@/lib/garage/store";

// Team 8 — Garage saved-vehicle surface exposed for cross-team consumption.
// Other teams that want to react to a buyer's saved-vehicle set (e.g. Team 10
// showing recent garage picks on the dashboard, Team 13 opening threads for
// saved listings) should import from here rather than reaching into
// `src/lib/garage` directly.

export type { GarageDecision, GarageItem, SaveGarageInput };

export const listGarage = (userId: string): Promise<GarageItem[]> =>
  listGarageItems(userId);

export const getSavedItem = (
  userId: string,
  listingId: string,
): Promise<GarageItem | null> => getGarageItem(userId, listingId);

export const saveToGarage = (input: SaveGarageInput): Promise<GarageItem> =>
  saveGarageItem(input);

export const updateDecision = (input: {
  userId: string;
  listingId: string;
  decision: GarageDecision;
}): Promise<GarageItem | null> => setGarageDecision(input);

export const removeFromGarage = (
  userId: string,
  listingId: string,
): Promise<void> => removeGarageItem(userId, listingId);
