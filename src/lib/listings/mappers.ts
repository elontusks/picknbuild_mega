import type {
  ListingObject,
  ListingSource,
  ListingStatus,
  TitleStatus,
} from "@/contracts";

export type ListingRow = {
  id: string;
  source: string;
  source_url: string;
  source_external_id: string | null;
  vin: string | null;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  mileage: number | null;
  title_status: string;
  price: number | string | null;
  current_bid: number | string | null;
  bin_price: number | string | null;
  estimated_market_value: number | string | null;
  fees: number | string | null;
  photos: string[] | null;
  location_zip: string | null;
  source_updated_at: string;
  last_refreshed_at: string;
  status: string;
  owner_user_id: string | null;
};

const numeric = (v: number | string | null | undefined): number | undefined => {
  if (v === null || v === undefined) return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const undefIfNull = <T,>(v: T | null | undefined): T | undefined =>
  v === null || v === undefined ? undefined : v;

export const rowToListing = (row: ListingRow): ListingObject => ({
  id: row.id,
  source: row.source as ListingSource,
  sourceUrl: row.source_url,
  vin: undefIfNull(row.vin),
  year: row.year,
  make: row.make,
  model: row.model,
  trim: undefIfNull(row.trim),
  mileage: undefIfNull(row.mileage),
  titleStatus: row.title_status as TitleStatus,
  price: numeric(row.price),
  currentBid: numeric(row.current_bid),
  binPrice: numeric(row.bin_price),
  estimatedMarketValue: numeric(row.estimated_market_value),
  fees: numeric(row.fees),
  photos: row.photos ?? [],
  locationZip: undefIfNull(row.location_zip),
  sourceUpdatedAt: row.source_updated_at,
  lastRefreshedAt: row.last_refreshed_at,
  status: row.status as ListingStatus,
  ownerUserId: undefIfNull(row.owner_user_id),
});

export type ListingInsert = Partial<Omit<ListingRow, "id" | "photos">> & {
  source: string;
  source_url: string;
  year: number;
  make: string;
  model: string;
  photos?: string[];
};

export const listingToInsert = (
  input: Omit<ListingObject, "id">,
  sourceExternalId?: string,
): ListingInsert => ({
  source: input.source,
  source_url: input.sourceUrl,
  source_external_id: sourceExternalId ?? null,
  vin: input.vin ?? null,
  year: input.year,
  make: input.make,
  model: input.model,
  trim: input.trim ?? null,
  mileage: input.mileage ?? null,
  title_status: input.titleStatus,
  price: input.price ?? null,
  current_bid: input.currentBid ?? null,
  bin_price: input.binPrice ?? null,
  estimated_market_value: input.estimatedMarketValue ?? null,
  fees: input.fees ?? null,
  photos: input.photos,
  location_zip: input.locationZip ?? null,
  source_updated_at: input.sourceUpdatedAt,
  last_refreshed_at: input.lastRefreshedAt,
  status: input.status,
  owner_user_id: input.ownerUserId ?? null,
});
