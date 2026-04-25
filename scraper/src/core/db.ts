/**
 * Postgres data layer for the scrape orchestrator (Supabase service-role client).
 *
 * Replaces the SQLite implementation from athin-scraper. The schema lives in
 * picknbuild_mega/supabase/migrations/20260425100000_scraper_tables.sql.
 *
 * Every function is async. Callers from the original scrape-orch were sync;
 * those call sites have been updated to await.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { NormalizedVehicle } from "./types.js";
import { log } from "./utils.js";

let client: SupabaseClient | null = null;

export function getClient(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) must be set"
      );
    }
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    log("info", "Connected to Supabase Postgres (service role)");
  }
  return client;
}

export function closeDb(): void {
  client = null;
}

// ── Types ──────────────────────────────────────────────────────────────

export interface ScrapeSiteRow {
  id: string;
  name: string;
  base_url: string;
  site_type: string;
  active: boolean;
  fc_specification: string | null;
  search_url_template: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScrapeRunDetails {
  url: string;
  status: "success" | "partial" | "failed";
  rawExtracted?: unknown;
  missingFields?: string[];
  errorMessage?: string;
  durationMs?: number;
}

// ── Site queries ───────────────────────────────────────────────────────

export async function getActiveSites(): Promise<ScrapeSiteRow[]> {
  const c = getClient();
  const { data, error } = await c
    .from("scrape_sites")
    .select("*")
    .eq("active", true);
  if (error) throw new Error(`getActiveSites: ${error.message}`);
  return (data ?? []) as ScrapeSiteRow[];
}

export async function getSiteByBaseUrl(
  baseUrl: string
): Promise<ScrapeSiteRow | null> {
  const c = getClient();
  const { data, error } = await c
    .from("scrape_sites")
    .select("*")
    .eq("base_url", baseUrl)
    .maybeSingle();
  if (error) throw new Error(`getSiteByBaseUrl: ${error.message}`);
  return (data as ScrapeSiteRow | null) ?? null;
}

export async function getSiteFcSpec(siteId: string): Promise<string | null> {
  const c = getClient();
  const { data, error } = await c
    .from("scrape_sites")
    .select("fc_specification")
    .eq("id", siteId)
    .maybeSingle();
  if (error) throw new Error(`getSiteFcSpec: ${error.message}`);
  return (data?.fc_specification as string | null) ?? null;
}

export async function updateSiteFcSpec(
  siteId: string,
  spec: string
): Promise<void> {
  const c = getClient();
  const { error } = await c
    .from("scrape_sites")
    .update({ fc_specification: spec, updated_at: new Date().toISOString() })
    .eq("id", siteId);
  if (error) throw new Error(`updateSiteFcSpec: ${error.message}`);
}

// ── Adapter name → site mapping ────────────────────────────────────────

const ADAPTER_SITE_MAP: Record<string, string> = {
  copart: "copart.com",
  iaai: "iaai.com",
};

export async function getSiteForAdapter(
  adapterName: string
): Promise<ScrapeSiteRow | null> {
  const baseUrl = ADAPTER_SITE_MAP[adapterName] ?? adapterName;
  return getSiteByBaseUrl(baseUrl);
}

// ── Listing → source mapping ───────────────────────────────────────────

/**
 * Map an adapter name to the source enum on public.listings. Built-in scrapers
 * (Copart, IAAI) keep their canonical values; everything else (Cars.com,
 * Bring-a-Trailer, etc., extracted via Firecrawl) is bucketed as 'firecrawl'.
 * The authoritative source is `scrape_site_id`.
 */
export function adapterToSource(adapterName: string): string {
  if (adapterName === "copart") return "copart";
  if (adapterName === "iaai") return "iaai";
  if (adapterName === "craigslist") return "craigslist";
  return "firecrawl";
}

/**
 * Map a raw title status string to the constrained enum on public.listings.
 * Original value is preserved in raw_title_status.
 */
export function mapTitleStatus(
  raw?: string | null
): "clean" | "rebuilt" | "unknown" {
  if (!raw) return "unknown";
  const s = raw.toLowerCase();
  if (s === "clean" || s.includes("clean title")) return "clean";
  if (s.includes("rebuilt") || s.includes("salvage")) return "rebuilt";
  return "unknown";
}

// ── Listing upsert ─────────────────────────────────────────────────────

/**
 * Upsert a NormalizedVehicle into public.listings keyed on (source, source_url).
 * Returns the listing UUID. Match score is optional and stored alongside.
 */
export async function insertOrUpdateListing(
  site: ScrapeSiteRow,
  vehicle: NormalizedVehicle,
  matchScore?: number
): Promise<string> {
  const c = getClient();
  const source = adapterToSource(vehicle.source ?? site.name.toLowerCase());
  const titleStatus = mapTitleStatus(vehicle.titleType);
  const price = vehicle.currentBid ?? vehicle.askingPrice ?? null;
  const imageUrl = vehicle.thumbnailUrl ?? vehicle.images?.[0] ?? null;
  const sourceUrl =
    vehicle.sourceUrl || `https://${site.base_url}/lot/${vehicle.sourceId}`;

  const row = {
    source,
    source_url: sourceUrl,
    source_external_id: vehicle.sourceId ?? null,
    scrape_site_id: site.id,
    vin: vehicle.vin || null,
    year: vehicle.year ?? null,
    make: vehicle.make ?? "Unknown",
    model: vehicle.model ?? "Unknown",
    trim: vehicle.trim ?? null,
    mileage: vehicle.odometer ?? null,
    title_status: titleStatus,
    raw_title_status: vehicle.titleType ?? null,
    price,
    current_bid: vehicle.currentBid ?? null,
    bin_price: vehicle.buyNowPrice ?? null,
    photos: vehicle.images ?? [],
    image_url: imageUrl,
    auction_location: vehicle.auctionLocation ?? null,
    source_updated_at: vehicle.scrapedAt ?? new Date().toISOString(),
    last_refreshed_at: new Date().toISOString(),
    status: "active",
    auction_date: vehicle.auctionDate ?? null,
    auction_timezone: vehicle.auctionTimezone ?? null,
    vehicle_condition: vehicle.startCode ?? null,
    primary_damage: vehicle.primaryDamage ?? null,
    secondary_damage: vehicle.secondaryDamage ?? null,
    loss_type: vehicle.lossType ?? null,
    engine: vehicle.engineType ?? null,
    transmission: vehicle.transmission ?? null,
    drive_type: vehicle.driveType ?? null,
    fuel_type: vehicle.fuelType ?? null,
    exterior_color: vehicle.exteriorColor ?? null,
    interior_color: vehicle.interiorColor ?? null,
    body_style: vehicle.bodyStyle ?? null,
    cylinders: vehicle.cylinders ?? null,
    has_keys: vehicle.hasKeys ?? null,
    odometer_brand: vehicle.odometerBrand ?? null,
    title_state: vehicle.titleState ?? null,
    seller: vehicle.seller ?? null,
    seller_type: vehicle.sellerType ?? null,
    watch_count: vehicle.watchCount ?? null,
    bid_count: vehicle.bidCount ?? null,
    acv: vehicle.actualCashValue ?? null,
    retail_value: vehicle.estimatedRetailValue ?? null,
    repair_estimate: vehicle.estimatedRepairCost ?? null,
    damage_estimate: vehicle.damageEstimate ?? null,
    lot_number: vehicle.lotNumber ?? null,
    match_score: matchScore ?? null,
  };

  const { data, error } = await c
    .from("listings")
    .upsert(row, { onConflict: "source,source_url" })
    .select("id")
    .single();

  if (error) throw new Error(`insertOrUpdateListing: ${error.message}`);
  if (!data?.id) throw new Error("insertOrUpdateListing: missing id in response");
  return data.id as string;
}

// ── Scrape run logging ─────────────────────────────────────────────────

export async function logScrapeRun(
  siteId: string,
  listingId: string | null,
  details: ScrapeRunDetails
): Promise<void> {
  const c = getClient();
  const { error } = await c.from("scrape_runs").insert({
    scrape_site_id: siteId,
    listing_id: listingId,
    url: details.url,
    status: details.status,
    raw_extracted: details.rawExtracted ?? null,
    missing_fields: details.missingFields ?? null,
    error_message: details.errorMessage ?? null,
    duration_ms: details.durationMs ?? null,
  });
  if (error) log("warn", `logScrapeRun failed: ${error.message}`);
}
