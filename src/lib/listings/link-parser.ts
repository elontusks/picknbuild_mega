import type { ListingObject, ListingSource } from "@/contracts";
import { nowIso } from "@/contracts";
import { normalizeListingPayload, normalizeVin } from "./normalizer";

export type LinkParseSuccess = {
  ok: true;
  listing: Omit<ListingObject, "id">;
  detectedSource: ListingSource;
};
export type LinkParseFailure = { ok: false; reason: string };
export type LinkParseResult = LinkParseSuccess | LinkParseFailure;

/**
 * Classifier for where a URL came from. Domain-only — no HTTP. Unknown domains
 * flow through the manual fallback (ch/02) rather than being guessed.
 */
export const classifyUrl = (url: string): ListingSource | null => {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (host.includes("copart.com")) return "copart";
  if (host.includes("iaai.com") || host.includes("iaa-auction.com")) return "iaai";
  if (host.includes("craigslist.org")) return "craigslist";
  if (host.includes("facebook.com") || host.includes("fb.com")) return "parsed-link";
  if (host.endsWith("pickandbuild.example.com")) return "dealer";
  return "parsed-link";
};

/**
 * Parse a user-pasted URL into a minimal-viable ListingObject. Real parsing
 * is the upstream scraper's job — Team 3 only owns the surface the user sees
 * ("Already Found a Car?" input) and the fallback to manual entry when the
 * URL is unusable. For v1 we synthesize a placeholder listing with the URL
 * stamped as `sourceUrl`; a follow-up job refreshes the row against the real
 * source and fills in year/make/model.
 */
export const parseLinkUrl = (url: string): LinkParseResult => {
  const trimmed = url.trim();
  if (!trimmed) return { ok: false, reason: "URL is required" };

  const detected = classifyUrl(trimmed);
  if (detected === null) return { ok: false, reason: "Not a valid URL" };

  // We can't hit the actual source — scrapers are black boxes and this fires
  // client-side. Emit a skeleton listing so the rest of the UI still renders;
  // the idle-sweep / scraper pipeline will backfill details if it picks this
  // URL up.
  const listing: Omit<ListingObject, "id"> = {
    source: "parsed-link",
    sourceUrl: trimmed,
    year: 0,
    make: "Unknown",
    model: "Unknown",
    titleStatus: "unknown",
    photos: [],
    sourceUpdatedAt: nowIso(),
    lastRefreshedAt: nowIso(),
    status: "active",
  };

  return { ok: true, listing, detectedSource: detected };
};

/**
 * Manual fallback entry (ch/02): user provides the minimum fields when the
 * URL parser can't get anything useful back. Produces a normalized listing
 * with `source: "parsed-link"`.
 */
export type ManualFallbackInput = {
  url?: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileage?: number;
  price?: number;
  vin?: string;
  titleStatus?: "clean" | "rebuilt" | "unknown";
  photos?: string[];
};

export const parseManualFallback = (input: ManualFallbackInput): LinkParseResult => {
  const url = input.url?.trim() || `manual://${Date.now()}`;
  const result = normalizeListingPayload({
    source: "parsed-link",
    sourceUrl: url,
    year: input.year,
    make: input.make,
    model: input.model,
    trim: input.trim,
    mileage: input.mileage ?? null,
    price: input.price ?? null,
    vin: input.vin ? normalizeVin(input.vin) : undefined,
    title: input.titleStatus ?? undefined,
    photos: input.photos ?? [],
  });
  if (!result.ok) return { ok: false, reason: result.reason };
  return { ok: true, listing: result.listing, detectedSource: "parsed-link" };
};
