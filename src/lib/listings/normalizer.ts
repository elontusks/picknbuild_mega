import type {
  ListingObject,
  ListingSource,
  TitleStatus,
} from "@/contracts";
import { nowIso } from "@/contracts";

/**
 * Raw payload shape the normalizer accepts. Scrapers are black boxes, but every
 * emitter must present at minimum these fields. Unknown fields are ignored so
 * upstream teams can evolve their payloads without breaking ingestion.
 */
export type RawListingPayload = {
  source: ListingSource;
  sourceUrl: string;
  sourceExternalId?: string;
  vin?: string | null;
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  mileage?: number | null;
  title?: string | null; // free-text title from source ("clean title", "salvage", etc.)
  price?: number | null;
  currentBid?: number | null;
  binPrice?: number | null;
  estimatedMarketValue?: number | null;
  fees?: number | null;
  photos?: string[] | null;
  locationZip?: string | null;
  sourceUpdatedAt?: string | null;
  ownerUserId?: string | null;
};

export type NormalizeResult =
  | { ok: true; listing: Omit<ListingObject, "id">; sourceExternalId?: string }
  | { ok: false; reason: string };

const trimString = (v: string | null | undefined): string | undefined => {
  if (v === null || v === undefined) return undefined;
  const t = v.trim();
  return t.length ? t : undefined;
};

const positive = (v: number | null | undefined): number | undefined => {
  if (v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;
export const normalizeVin = (vin: string | null | undefined): string | undefined => {
  const t = trimString(vin);
  if (!t) return undefined;
  const up = t.toUpperCase();
  return VIN_REGEX.test(up) ? up : undefined;
};

/**
 * Map free-text title text to the three-value enum. Anything unrecognized
 * becomes 'unknown' so the Title Preference Filter (Team 4) can hide it when
 * the buyer selects "clean only" or "rebuilt only".
 */
export const normalizeTitle = (input: string | null | undefined): TitleStatus => {
  const t = (input ?? "").toLowerCase();
  if (!t) return "unknown";
  if (t.includes("rebuilt") || t.includes("reconstructed") || t.includes("salvage rebuilt")) {
    return "rebuilt";
  }
  if (t.includes("clean") || t === "standard" || t === "clear") {
    return "clean";
  }
  // salvage-only / flood / junk / lemon all don't map cleanly to clean or rebuilt.
  return "unknown";
};

export const normalizeZip = (zip: string | null | undefined): string | undefined => {
  const t = trimString(zip);
  if (!t) return undefined;
  return /^\d{5}$/.test(t) ? t : undefined;
};

/**
 * Idempotent normalizer. Same payload → same output (modulo `lastRefreshedAt`
 * which is always set to now because this is the refresh moment). Consumers
 * upsert by (source, sourceUrl) so repeated calls don't duplicate rows.
 */
export const normalizeListingPayload = (
  payload: RawListingPayload,
): NormalizeResult => {
  const sourceUrl = trimString(payload.sourceUrl);
  if (!sourceUrl) return { ok: false, reason: "sourceUrl is required" };

  if (!payload.year || !Number.isInteger(payload.year)) {
    return { ok: false, reason: "year must be an integer" };
  }
  const make = trimString(payload.make);
  const model = trimString(payload.model);
  if (!make || !model) {
    return { ok: false, reason: "make and model are required" };
  }

  const listing: Omit<ListingObject, "id"> = {
    source: payload.source,
    sourceUrl,
    vin: normalizeVin(payload.vin),
    year: payload.year,
    make,
    model,
    trim: trimString(payload.trim),
    mileage: positive(payload.mileage),
    titleStatus: normalizeTitle(payload.title),
    price: positive(payload.price),
    currentBid: positive(payload.currentBid),
    binPrice: positive(payload.binPrice),
    estimatedMarketValue: positive(payload.estimatedMarketValue),
    fees: positive(payload.fees),
    photos: payload.photos?.filter((p) => !!trimString(p)) ?? [],
    locationZip: normalizeZip(payload.locationZip),
    sourceUpdatedAt: payload.sourceUpdatedAt ?? nowIso(),
    lastRefreshedAt: nowIso(),
    status: "active",
    ownerUserId: trimString(payload.ownerUserId),
  };

  return {
    ok: true,
    listing,
    sourceExternalId: trimString(payload.sourceExternalId),
  };
};
