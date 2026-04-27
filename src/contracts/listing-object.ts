import { nextFixtureId, nowIso, type ISOTimestamp } from "./common";

export type ListingSource =
  | "copart"
  | "iaai"
  | "craigslist"
  | "dealer"
  | "user"
  | "parsed-link"
  | "firecrawl";

export type TitleStatus = "clean" | "rebuilt" | "unknown";

export type ListingStatus = "active" | "stale" | "removed";

export type ListingObject = {
  id: string;
  source: ListingSource;
  sourceUrl: string;
  vin?: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileage?: number;
  titleStatus: TitleStatus;
  price?: number;
  currentBid?: number;
  binPrice?: number;
  estimatedMarketValue?: number;
  fees?: number;
  photos: string[];
  locationZip?: string;
  sourceUpdatedAt: ISOTimestamp;
  lastRefreshedAt: ISOTimestamp;
  status: ListingStatus;
  ownerUserId?: string;
};

export const makeFixtureListingObject = (
  overrides: Partial<ListingObject> = {},
): ListingObject => ({
  id: nextFixtureId("listing"),
  source: "dealer",
  sourceUrl: "https://example.com/listing",
  vin: "1HGCM82633A004352",
  year: 2019,
  make: "Honda",
  model: "Accord",
  trim: "Sport",
  mileage: 58000,
  titleStatus: "clean",
  price: 18500,
  photos: [],
  locationZip: "43210",
  sourceUpdatedAt: nowIso(),
  lastRefreshedAt: nowIso(),
  status: "active",
  ...overrides,
});
