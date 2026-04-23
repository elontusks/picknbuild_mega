import "server-only";

import type { ListingObject } from "@/contracts";
import * as Storage from "@/services/team-15-storage";

// Team 8 — garage saved-vehicle persistence. One record per
// (userId, listingId) stored in the "garage_items" bucket through Team 15's
// secure storage layer. We intentionally don't copy the full ListingObject:
// the listing body is hydrated on read through Team 3's `getListing` so edits
// upstream (price, status, refresh timestamps) surface immediately.

export const GARAGE_BUCKET = "garage_items";
export const GARAGE_INDEX_BUCKET = "garage_items_by_user";

export type GarageDecision = "pick" | "pass" | null;

export type GarageItem = {
  userId: string;
  listingId: string;
  addedAt: string;
  decision: GarageDecision;
  groupKey: string;
};

export const makeGroupKey = (listing: Pick<ListingObject, "year" | "make" | "model">): string =>
  `${listing.year}-${listing.make}-${listing.model}`.toLowerCase();

const recordKey = (userId: string, listingId: string): string =>
  `${userId}:${listingId}`;

const readIndex = async (userId: string): Promise<string[]> =>
  (await Storage.getRecord<string[]>(GARAGE_INDEX_BUCKET, userId)) ?? [];

const writeIndex = async (userId: string, listingIds: string[]): Promise<void> => {
  await Storage.putRecord(GARAGE_INDEX_BUCKET, userId, listingIds);
};

export const listGarageItems = async (userId: string): Promise<GarageItem[]> => {
  const ids = await readIndex(userId);
  if (ids.length === 0) return [];
  const items = await Promise.all(
    ids.map((listingId) =>
      Storage.getRecord<GarageItem>(GARAGE_BUCKET, recordKey(userId, listingId)),
    ),
  );
  return items
    .filter((i): i is GarageItem => i !== null)
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt));
};

export const getGarageItem = async (
  userId: string,
  listingId: string,
): Promise<GarageItem | null> =>
  Storage.getRecord<GarageItem>(GARAGE_BUCKET, recordKey(userId, listingId));

export type SaveGarageInput = {
  userId: string;
  listing: ListingObject;
  decision?: GarageDecision;
};

export const saveGarageItem = async (
  input: SaveGarageInput,
): Promise<GarageItem> => {
  const key = recordKey(input.userId, input.listing.id);
  const existing = await Storage.getRecord<GarageItem>(GARAGE_BUCKET, key);
  const item: GarageItem = existing
    ? {
        ...existing,
        decision: input.decision !== undefined ? input.decision : existing.decision,
      }
    : {
        userId: input.userId,
        listingId: input.listing.id,
        addedAt: new Date().toISOString(),
        decision: input.decision ?? null,
        groupKey: makeGroupKey(input.listing),
      };
  await Storage.putRecord(GARAGE_BUCKET, key, item);
  if (!existing) {
    const ids = await readIndex(input.userId);
    if (!ids.includes(input.listing.id)) {
      await writeIndex(input.userId, [...ids, input.listing.id]);
    }
  }
  return item;
};

export const setGarageDecision = async (input: {
  userId: string;
  listingId: string;
  decision: GarageDecision;
}): Promise<GarageItem | null> => {
  const key = recordKey(input.userId, input.listingId);
  const existing = await Storage.getRecord<GarageItem>(GARAGE_BUCKET, key);
  if (!existing) return null;
  const next: GarageItem = { ...existing, decision: input.decision };
  await Storage.putRecord(GARAGE_BUCKET, key, next);
  return next;
};

export const removeGarageItem = async (
  userId: string,
  listingId: string,
): Promise<void> => {
  await Storage.removeRecord(GARAGE_BUCKET, recordKey(userId, listingId));
  const ids = await readIndex(userId);
  const next = ids.filter((id) => id !== listingId);
  if (next.length !== ids.length) {
    await writeIndex(userId, next);
  }
};
