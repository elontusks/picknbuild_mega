/**
 * Curated "Hottest Auctions" feed persistence helpers (Postgres).
 */

import { getClient, insertOrUpdateListing, type ScrapeSiteRow } from "./db.js";
import type { NormalizedVehicle } from "./types.js";
import { log } from "./utils.js";

export interface CuratedFeedItem {
  curated_id: string;
  scrape_site_id: string;
  listing_id: string;
  rank: number;
  hotness_score: number | null;
  curated_at: string;
  expires_at: string | null;
  site_name: string;
  site_base_url: string;
  source_external_id: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  price: number | null;
  bin_price: number | null;
  auction_time_left: string | null;
  image_url: string | null;
  photos: string[] | null;
  title_status: string | null;
  mileage: number | null;
  auction_location: string | null;
  vin: string | null;
  source_url: string | null;
  engine: string | null;
  transmission: string | null;
  drive_type: string | null;
  fuel_type: string | null;
  exterior_color: string | null;
  has_keys: boolean | null;
  primary_damage: string | null;
  secondary_damage: string | null;
  match_score: number | null;
  source_updated_at: string;
}

/**
 * Fetch non-expired curated rows joined with their listing + site rows.
 */
export async function getCuratedFeed(
  scrapeSiteId?: string,
  limit: number = 20
): Promise<CuratedFeedItem[]> {
  const c = getClient();

  // Build a join query: curated_listings -> scrape_sites + listings.
  let q = c
    .from("curated_listings")
    .select(
      `
      id,
      scrape_site_id,
      listing_id,
      rank,
      hotness_score,
      curated_at,
      expires_at,
      scrape_sites:scrape_site_id ( name, base_url ),
      listings:listing_id (
        source_external_id, make, model, year, price, bin_price,
        auction_time_left, image_url, photos, title_status, mileage,
        auction_location, vin, source_url, engine, transmission,
        drive_type, fuel_type, exterior_color, has_keys, primary_damage,
        secondary_damage, match_score, source_updated_at
      )
    `
    )
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("curated_at", { ascending: false })
    .order("rank", { ascending: true })
    .limit(limit);

  if (scrapeSiteId) q = q.eq("scrape_site_id", scrapeSiteId);

  const { data, error } = await q;
  if (error) {
    log("error", `getCuratedFeed: ${error.message}`);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    curated_id: row.id,
    scrape_site_id: row.scrape_site_id,
    listing_id: row.listing_id,
    rank: row.rank,
    hotness_score: row.hotness_score,
    curated_at: row.curated_at,
    expires_at: row.expires_at,
    site_name: row.scrape_sites?.name ?? "",
    site_base_url: row.scrape_sites?.base_url ?? "",
    source_external_id: row.listings?.source_external_id ?? null,
    make: row.listings?.make ?? null,
    model: row.listings?.model ?? null,
    year: row.listings?.year ?? null,
    price: row.listings?.price ?? null,
    bin_price: row.listings?.bin_price ?? null,
    auction_time_left: row.listings?.auction_time_left ?? null,
    image_url: row.listings?.image_url ?? null,
    photos: row.listings?.photos ?? null,
    title_status: row.listings?.title_status ?? null,
    mileage: row.listings?.mileage ?? null,
    auction_location: row.listings?.auction_location ?? null,
    vin: row.listings?.vin ?? null,
    source_url: row.listings?.source_url ?? null,
    engine: row.listings?.engine ?? null,
    transmission: row.listings?.transmission ?? null,
    drive_type: row.listings?.drive_type ?? null,
    fuel_type: row.listings?.fuel_type ?? null,
    exterior_color: row.listings?.exterior_color ?? null,
    has_keys: row.listings?.has_keys ?? null,
    primary_damage: row.listings?.primary_damage ?? null,
    secondary_damage: row.listings?.secondary_damage ?? null,
    match_score: row.listings?.match_score ?? null,
    source_updated_at: row.listings?.source_updated_at ?? row.curated_at,
  }));
}

/**
 * Mark every active curated row for this site as expired. Called before
 * inserting a fresh batch so the feed only ever shows the latest 10 per source.
 */
export async function markBatchExpired(scrapeSiteId: string): Promise<number> {
  const c = getClient();
  const now = new Date().toISOString();
  const { data, error } = await c
    .from("curated_listings")
    .update({ expires_at: now })
    .eq("scrape_site_id", scrapeSiteId)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .select("id");
  if (error) {
    log("warn", `markBatchExpired: ${error.message}`);
    return 0;
  }
  return data?.length ?? 0;
}

/**
 * Upsert each vehicle into listings, then insert a curated_listings row for
 * each with rank 1..N. expires_at = min(auctionEnd, now+24h).
 */
export async function insertCuratedBatch(
  site: ScrapeSiteRow,
  vehicles: NormalizedVehicle[]
): Promise<number> {
  if (vehicles.length === 0) return 0;
  const c = getClient();

  const now = Date.now();
  const twentyFourHoursMs = 24 * 60 * 60 * 1000;
  let inserted = 0;

  for (let i = 0; i < vehicles.length; i++) {
    const v = vehicles[i];
    const rank = i + 1;

    let listingId: string;
    try {
      listingId = await insertOrUpdateListing(site, v);
    } catch (err: any) {
      log("warn", `[curated] upsert listing ${v.sourceId} failed: ${err.message}`);
      continue;
    }

    let expiresAtMs = now + twentyFourHoursMs;
    if (v.auctionDate) {
      const auctionMs = Date.parse(v.auctionDate);
      if (!isNaN(auctionMs) && auctionMs > now && auctionMs < expiresAtMs) {
        expiresAtMs = auctionMs;
      }
    }
    const expiresAtIso = new Date(expiresAtMs).toISOString();

    const { error } = await c.from("curated_listings").insert({
      scrape_site_id: site.id,
      listing_id: listingId,
      rank,
      hotness_score: v.hotnessScore ?? null,
      expires_at: expiresAtIso,
    });
    if (error) {
      log("warn", `[curated] insert curated row failed: ${error.message}`);
      continue;
    }
    inserted++;
  }

  return inserted;
}
