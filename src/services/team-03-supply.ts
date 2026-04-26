import "server-only";
import type { ListingObject } from "@/contracts";
import { nowIso } from "@/contracts";
import {
  getListing as getListingFromStore,
  listListings as listListingsFromStore,
  listListingsByVin,
  runIdleSweep,
  setListingStatus,
  upsertListing,
  type ListingFilter,
} from "@/lib/listings/store";
import { listingToInsert } from "@/lib/listings/mappers";
import {
  normalizeListingPayload,
  type RawListingPayload,
} from "@/lib/listings/normalizer";
import { shouldRefresh } from "@/lib/listings/refresh";
import {
  parseLinkUrl,
  parseManualFallback,
  type LinkParseResult,
  type ManualFallbackInput,
} from "@/lib/listings/link-parser";
import {
  lookupVin as lookupVinInternal,
  type VinLookupResponse,
} from "@/lib/listings/vin-lookup";
import { validateListingForm, type ListingFormInput } from "@/lib/listings/validate";

// --- Listing store reads ------------------------------------------------------

export type { ListingFilter };

export const listListings = (filter: ListingFilter = {}): Promise<ListingObject[]> =>
  listListingsFromStore(filter);

export const getListing = (id: string): Promise<ListingObject | null> =>
  getListingFromStore(id);

export const getListingsByVin = (vin: string): Promise<ListingObject[]> =>
  listListingsByVin(vin);

// --- Ingestion normalizer -----------------------------------------------------

export type IngestResult =
  | { ok: true; listing: ListingObject }
  | { ok: false; reason: string };

/**
 * Server-only entry the ingestion job calls for each normalized scraper row.
 * Uses the admin client so scraper-sourced inserts (copart/iaai/craigslist)
 * bypass RLS. Idempotent on (source, source_url).
 */
export async function ingestListing(payload: RawListingPayload): Promise<IngestResult> {
  const normalized = normalizeListingPayload(payload);
  if (!normalized.ok) return { ok: false, reason: normalized.reason };
  const insert = listingToInsert(normalized.listing, normalized.sourceExternalId);
  const listing = await upsertListing({ listing: insert, client: "admin" });
  return { ok: true, listing };
}

// --- On-view refresh ----------------------------------------------------------

export type RefreshResult =
  | { ok: true; listing: ListingObject; refreshed: boolean; reason?: string }
  | { ok: false; reason: string };

/**
 * Called when the buyer opens a Vehicle Detail view. If the listing's source
 * has a cooldown and the cooldown has elapsed, we re-stamp lastRefreshedAt and
 * (in a real system) kick a scraper refetch. For now we just bump the
 * timestamp so downstream UIs see the row as "just looked at."
 */
export async function refreshListing(id: string): Promise<RefreshResult> {
  const existing = await getListingFromStore(id);
  if (!existing) return { ok: false, reason: "Listing not found" };

  const decision = shouldRefresh(existing.source, existing.lastRefreshedAt);
  if (!decision.refresh) {
    return {
      ok: true,
      listing: existing,
      refreshed: false,
      reason: decision.reason,
    };
  }
  const updated = await upsertListing({
    listing: listingToInsert({ ...existing, lastRefreshedAt: nowIso() }),
    client: "admin",
  });
  return { ok: true, listing: updated, refreshed: true };
}

// --- Idle sweep ---------------------------------------------------------------

export async function idleSweep(): Promise<{ marked: number }> {
  const { marked } = await runIdleSweep();
  return { marked };
}

export async function markListingStatus(
  id: string,
  status: "active" | "stale" | "removed",
): Promise<void> {
  await setListingStatus(id, status);
}

// --- Link parser --------------------------------------------------------------

export type LinkParseServiceResult =
  | { ok: true; listing: ListingObject }
  | { ok: false; reason: string };

/**
 * Parse a URL and persist the resulting skeleton ListingObject (with owner =
 * current authenticated user). Returns the persisted row so the Search Intake
 * can immediately render the four-path display.
 */
export async function parseLink(
  url: string,
  ownerUserId?: string,
): Promise<LinkParseServiceResult> {
  const result: LinkParseResult = parseLinkUrl(url);
  if (!result.ok) return { ok: false, reason: result.reason };
  const listing = { ...result.listing, ownerUserId };
  const insert = listingToInsert(listing);
  const persisted = await upsertListing({ listing: insert });
  return { ok: true, listing: persisted };
}

export async function submitManualFallback(
  input: ManualFallbackInput,
  ownerUserId?: string,
): Promise<LinkParseServiceResult> {
  const result = parseManualFallback(input);
  if (!result.ok) return { ok: false, reason: result.reason };
  const listing = { ...result.listing, ownerUserId };
  const insert = listingToInsert(listing);
  const persisted = await upsertListing({ listing: insert });
  return { ok: true, listing: persisted };
}

// --- VIN lookup ---------------------------------------------------------------

export type VinLookup = VinLookupResponse;

export const lookupVin = async (vin: string): Promise<VinLookup> =>
  lookupVinInternal(vin);

// --- User + dealer upload -----------------------------------------------------

export type ListingSubmitResult =
  | { ok: true; listing: ListingObject }
  | { ok: false; reason: string; field?: string };

type SubmitInput = {
  ownerUserId: string;
  form: ListingFormInput;
};

async function submitOwnerListing(
  source: "user" | "dealer",
  { ownerUserId, form }: SubmitInput,
): Promise<ListingSubmitResult> {
  const validated = validateListingForm(form);
  if (!validated.ok) {
    return { ok: false, reason: validated.error, field: validated.field };
  }
  const v = validated.value;
  const sourceUrl =
    v.sourceUrl ??
    `https://picknbuild.example.com/${source}-post/${ownerUserId}/${v.year}-${v.make}-${v.model}`.toLowerCase();

  const listing: Omit<ListingObject, "id"> = {
    source,
    sourceUrl,
    vin: v.vin,
    year: v.year,
    make: v.make,
    model: v.model,
    trim: v.trim,
    mileage: v.mileage,
    titleStatus: v.titleStatus,
    price: v.price,
    photos: v.photos,
    locationZip: v.locationZip,
    sourceUpdatedAt: nowIso(),
    lastRefreshedAt: nowIso(),
    status: "active",
    ownerUserId,
  };

  const persisted = await upsertListing({ listing: listingToInsert(listing) });
  return { ok: true, listing: persisted };
}

export const uploadUserListing = (input: SubmitInput): Promise<ListingSubmitResult> =>
  submitOwnerListing("user", input);

export const upsertDealerListing = (input: SubmitInput): Promise<ListingSubmitResult> =>
  submitOwnerListing("dealer", input);
