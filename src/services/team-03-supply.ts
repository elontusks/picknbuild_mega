import {
  makeFixtureListingObject,
  type ListingObject,
  type ListingSource,
  type TitleStatus,
} from "@/contracts";

export type ListingFilter = {
  source?: ListingSource;
  ownerUserId?: string;
  make?: string;
  model?: string;
  yearRange?: [number, number];
  titleStatus?: TitleStatus;
  locationZip?: string;
  limit?: number;
};

export const listListings = async (
  filter: ListingFilter = {},
): Promise<ListingObject[]> => {
  const limit = filter.limit ?? 8;
  return Array.from({ length: limit }, (_, i) =>
    makeFixtureListingObject({
      make: filter.make ?? "Honda",
      model: filter.model ?? "Accord",
      year: (filter.yearRange?.[0] ?? 2018) + (i % 3),
      source: filter.source ?? "dealer",
      ownerUserId: filter.ownerUserId,
    }),
  );
};

export const getListing = async (id: string): Promise<ListingObject | null> => {
  return makeFixtureListingObject({ id });
};

export const refreshListing = async (id: string): Promise<ListingObject> => {
  return makeFixtureListingObject({ id, lastRefreshedAt: new Date().toISOString() });
};

export const idleSweep = async (): Promise<{ marked: number }> => ({ marked: 0 });

export type LinkParseSuccess = { ok: true; listing: ListingObject };
export type LinkParseFailure = { ok: false; reason: string };
export type LinkParseResult = LinkParseSuccess | LinkParseFailure;

export const parseLink = async (url: string): Promise<LinkParseResult> => ({
  ok: true,
  listing: makeFixtureListingObject({ source: "parsed-link", sourceUrl: url }),
});

export const submitManualFallback = async (input: {
  title: string;
  price: number;
  image?: string;
}): Promise<ListingObject> =>
  makeFixtureListingObject({
    source: "parsed-link",
    price: input.price,
    photos: input.image ? [input.image] : [],
  });

export type VinLookup = {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileage?: number;
  titleStatus?: TitleStatus;
};

export const lookupVin = async (vin: string): Promise<VinLookup | null> => ({
  vin,
  year: 2019,
  make: "Honda",
  model: "Accord",
  trim: "Sport",
  mileage: 58000,
  titleStatus: "clean",
});

export const uploadUserListing = async (input: {
  ownerUserId: string;
  listing: Omit<ListingObject, "id" | "sourceUpdatedAt" | "lastRefreshedAt" | "status">;
}): Promise<ListingObject> =>
  makeFixtureListingObject({
    ...input.listing,
    ownerUserId: input.ownerUserId,
    source: "user",
  });

export const upsertDealerListing = async (input: {
  ownerUserId: string;
  listing: Omit<ListingObject, "id" | "sourceUpdatedAt" | "lastRefreshedAt" | "status">;
}): Promise<ListingObject> =>
  makeFixtureListingObject({
    ...input.listing,
    ownerUserId: input.ownerUserId,
    source: "dealer",
  });
