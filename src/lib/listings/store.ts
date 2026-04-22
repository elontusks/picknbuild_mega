import "server-only";
import type {
  ListingObject,
  ListingSource,
  ListingStatus,
  TitleStatus,
} from "@/contracts";
import { nowIso } from "@/contracts";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rowToListing, type ListingInsert, type ListingRow } from "./mappers";
import { classifyIdleSweep } from "./idle-sweep";

const LISTING_COLUMNS =
  "id, source, source_url, source_external_id, vin, year, make, model, trim, mileage, title_status, price, current_bid, bin_price, estimated_market_value, fees, photos, location_zip, source_updated_at, last_refreshed_at, status, owner_user_id";

export type ListingFilter = {
  source?: ListingSource;
  sources?: ListingSource[];
  ownerUserId?: string;
  make?: string;
  model?: string;
  yearRange?: [number, number];
  mileageMax?: number;
  titleStatus?: TitleStatus | "any";
  titlePreference?: "clean" | "rebuilt" | "both";
  status?: ListingStatus | "any";
  locationZip?: string;
  vin?: string;
  limit?: number;
  offset?: number;
};

/**
 * Default filter for the public search surface: active rows only. Callers can
 * override by passing `status: 'any'` (admin listings inventory does this).
 */
const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 100;

export async function listListings(
  filter: ListingFilter = {},
): Promise<ListingObject[]> {
  const supabase = await createClient();
  const limit = Math.min(filter.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
  const offset = filter.offset ?? 0;

  let q = supabase
    .from("listings")
    .select(LISTING_COLUMNS)
    .order("last_refreshed_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const status = filter.status ?? "active";
  if (status !== "any") q = q.eq("status", status);

  if (filter.source) q = q.eq("source", filter.source);
  else if (filter.sources?.length) q = q.in("source", filter.sources);

  if (filter.ownerUserId) q = q.eq("owner_user_id", filter.ownerUserId);
  if (filter.make) q = q.ilike("make", filter.make);
  if (filter.model) q = q.ilike("model", filter.model);
  if (filter.yearRange) {
    q = q.gte("year", filter.yearRange[0]).lte("year", filter.yearRange[1]);
  }
  if (filter.mileageMax !== undefined) q = q.lte("mileage", filter.mileageMax);
  if (filter.locationZip) q = q.eq("location_zip", filter.locationZip);
  if (filter.vin) q = q.eq("vin", filter.vin);

  // Title preference: 'both' leaves everything (including unknown).
  // 'clean' / 'rebuilt' hide rows whose parsed title is neither — which, at the
  // row level, means "hide everything that isn't the requested title".
  if (filter.titlePreference && filter.titlePreference !== "both") {
    q = q.eq("title_status", filter.titlePreference);
  } else if (filter.titleStatus && filter.titleStatus !== "any") {
    q = q.eq("title_status", filter.titleStatus);
  }

  const { data, error } = await q;
  if (error) throw new Error(`listListings: ${error.message}`);
  return (data ?? []).map((row) => rowToListing(row as ListingRow));
}

export async function getListing(id: string): Promise<ListingObject | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getListing: ${error.message}`);
  if (!data) return null;
  return rowToListing(data as ListingRow);
}

export async function listListingsByVin(vin: string): Promise<ListingObject[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_COLUMNS)
    .eq("vin", vin)
    .order("last_refreshed_at", { ascending: false });
  if (error) throw new Error(`listListingsByVin: ${error.message}`);
  return (data ?? []).map((row) => rowToListing(row as ListingRow));
}

/**
 * Upsert a listing by (source, source_url). Used by:
 * - the ingestion normalizer (scraper path, admin client)
 * - the on-view refresh service (admin client; payload may come from a worker)
 * - the dealer-posted / user-posted form handlers (user client, RLS-gated)
 * - the link parser (user client; 'parsed-link' with owner = current user)
 */
export type UpsertArgs = {
  listing: ListingInsert;
  client?: "user" | "admin";
};

export async function upsertListing({
  listing,
  client = "user",
}: UpsertArgs): Promise<ListingObject> {
  const db = client === "admin" ? createAdminClient() : await createClient();
  const { data, error } = await db
    .from("listings")
    .upsert(listing, { onConflict: "source,source_url" })
    .select(LISTING_COLUMNS)
    .single();
  if (error) throw new Error(`upsertListing: ${error.message}`);
  return rowToListing(data as ListingRow);
}

export async function setListingStatus(
  id: string,
  status: ListingStatus,
): Promise<void> {
  const db = createAdminClient();
  const { error } = await db
    .from("listings")
    .update({ status, last_refreshed_at: nowIso() })
    .eq("id", id);
  if (error) throw new Error(`setListingStatus: ${error.message}`);
}

export async function touchListingRefreshedAt(id: string): Promise<void> {
  const db = createAdminClient();
  const { error } = await db
    .from("listings")
    .update({ last_refreshed_at: nowIso() })
    .eq("id", id);
  if (error) throw new Error(`touchListingRefreshedAt: ${error.message}`);
}

export async function deleteListing(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("listings").delete().eq("id", id);
  if (error) throw new Error(`deleteListing: ${error.message}`);
}

/**
 * Idle sweep — marks rows `stale` / `removed` based on age since last refresh.
 * Runs as admin. Returns the number of rows transitioned. Safe to call from
 * a cron/job surface (Team 15 admin dashboard).
 */
export async function runIdleSweep(): Promise<{ marked: number; changes: ReturnType<typeof classifyIdleSweep> }> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("listings")
    .select("id, status, last_refreshed_at")
    .neq("status", "removed");
  if (error) throw new Error(`runIdleSweep: ${error.message}`);

  const changes = classifyIdleSweep(
    (data ?? []).map((r) => ({
      id: r.id as string,
      status: r.status as ListingStatus,
      lastRefreshedAt: r.last_refreshed_at as string,
    })),
  );
  for (const change of changes) {
    const { error: upErr } = await db
      .from("listings")
      .update({ status: change.to })
      .eq("id", change.id);
    if (upErr) throw new Error(`runIdleSweep update: ${upErr.message}`);
  }
  return { marked: changes.length, changes };
}
