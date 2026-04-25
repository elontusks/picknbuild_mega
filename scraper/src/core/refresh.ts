/**
 * Background-refresh logic for listing detail page visits (Postgres).
 *
 * When a user opens a listing detail page, the web app proxies a POST to
 * `/refresh/:listingId` on the orchestrator. This module:
 *   1. Loads the listing row from Postgres.
 *   2. Debounces aggressive refreshes (default 15 min).
 *   3. Routes to the correct adapter via the Orchestrator registry.
 *   4. Calls adapter.getDetails() and diffs volatile fields.
 *   5. Persists field-level updates + an entry in listing_refresh_runs.
 */

import { Orchestrator } from "./orchestrator.js";
import { getClient } from "./db.js";
import type { NormalizedVehicle } from "./types.js";
import { log } from "./utils.js";

export type RefreshStatus = "success" | "unchanged" | "failed" | "debounced";

export interface ChangedField {
  field: string;
  from: unknown;
  to: unknown;
}

export interface RefreshResult {
  status: RefreshStatus;
  changedFields: ChangedField[];
  prev: Record<string, unknown>;
  next: Record<string, unknown>;
  durationMs: number;
  error?: string;
}

const VOLATILE_FIELDS = [
  "price",
  "bin_price",
  "auction_time_left",
  "mileage",
  "image_url",
  "primary_damage",
  "title_status",
  "auction_location",
] as const;

interface ListingRow {
  id: string;
  scrape_site_id: string | null;
  source_external_id: string | null;
  price: number | null;
  bin_price: number | null;
  auction_time_left: string | null;
  mileage: number | null;
  image_url: string | null;
  primary_damage: string | null;
  title_status: string | null;
  auction_location: string | null;
  last_refreshed_at: string | null;
}

let orchestratorRef: Orchestrator | null = null;

export function setOrchestrator(orch: Orchestrator): void {
  orchestratorRef = orch;
}

const SITE_URL_TO_ADAPTER: Record<string, string> = {
  "copart.com": "copart",
  "iaai.com": "iaai",
};

function adapterNameForSite(baseUrl: string): string {
  return SITE_URL_TO_ADAPTER[baseUrl] ?? baseUrl;
}

export async function refreshListing(listingId: string): Promise<RefreshResult> {
  const start = Date.now();
  const empty: Record<string, unknown> = {};

  if (!listingId) {
    return {
      status: "failed",
      changedFields: [],
      prev: empty,
      next: empty,
      durationMs: Date.now() - start,
      error: "invalid listing id",
    };
  }

  const c = getClient();

  const { data: row, error: rowError } = await c
    .from("listings")
    .select(
      "id, scrape_site_id, source_external_id, price, bin_price, auction_time_left, mileage, image_url, primary_damage, title_status, auction_location, last_refreshed_at"
    )
    .eq("id", listingId)
    .maybeSingle();

  if (rowError) {
    return {
      status: "failed",
      changedFields: [],
      prev: empty,
      next: empty,
      durationMs: Date.now() - start,
      error: rowError.message,
    };
  }
  if (!row) {
    return {
      status: "failed",
      changedFields: [],
      prev: empty,
      next: empty,
      durationMs: Date.now() - start,
      error: "not found",
    };
  }

  const listing = row as ListingRow;

  const debounceSecs = parseInt(
    process.env.REFRESH_DEBOUNCE_SECONDS ?? "900",
    10
  );
  if (listing.last_refreshed_at) {
    const last = Date.parse(listing.last_refreshed_at);
    if (!isNaN(last)) {
      const ageSec = (Date.now() - last) / 1000;
      if (ageSec < debounceSecs) {
        log(
          "info",
          `[refresh] listing ${listingId} debounced (${Math.round(ageSec)}s < ${debounceSecs}s)`
        );
        return {
          status: "debounced",
          changedFields: [],
          prev: empty,
          next: empty,
          durationMs: Date.now() - start,
        };
      }
    }
  }

  if (!listing.scrape_site_id) {
    return {
      status: "failed",
      changedFields: [],
      prev: rowToSnapshot(listing),
      next: empty,
      durationMs: Date.now() - start,
      error: "no scrape_site_id (not a scraped listing)",
    };
  }

  const { data: site, error: siteError } = await c
    .from("scrape_sites")
    .select("id, base_url")
    .eq("id", listing.scrape_site_id)
    .maybeSingle();

  if (siteError || !site) {
    return {
      status: "failed",
      changedFields: [],
      prev: rowToSnapshot(listing),
      next: empty,
      durationMs: Date.now() - start,
      error: siteError?.message ?? "site not found",
    };
  }

  if (!orchestratorRef) {
    return {
      status: "failed",
      changedFields: [],
      prev: rowToSnapshot(listing),
      next: empty,
      durationMs: Date.now() - start,
      error: "orchestrator not initialized",
    };
  }

  const adapterName = adapterNameForSite(site.base_url);
  const adapterStatus = orchestratorRef
    .status()
    .find((a) => a.name === adapterName);
  if (!adapterStatus || !adapterStatus.ready) {
    const reason = !adapterStatus
      ? "adapter not registered"
      : "adapter not ready";
    log("warn", `[refresh] listing ${listingId}: ${reason} (${adapterName})`);
    return {
      status: "failed",
      changedFields: [],
      prev: rowToSnapshot(listing),
      next: empty,
      durationMs: Date.now() - start,
      error: reason,
    };
  }

  if (!listing.source_external_id) {
    return {
      status: "failed",
      changedFields: [],
      prev: rowToSnapshot(listing),
      next: empty,
      durationMs: Date.now() - start,
      error: "missing source_external_id",
    };
  }

  let fresh: NormalizedVehicle | null = null;
  let fetchError: string | undefined;
  try {
    fresh = await withTimeout(
      orchestratorRef.getDetails(adapterName, listing.source_external_id),
      30_000,
      "adapter timeout"
    );
  } catch (err) {
    fetchError = err instanceof Error ? err.message : String(err);
  }

  if (!fresh) {
    const err = fetchError ?? "adapter returned null";
    log("warn", `[refresh] listing ${listingId}: ${err}`);
    await safeInsertRun(listingId, {
      changedFields: [],
      prev: rowToSnapshot(listing),
      next: empty,
      durationMs: Date.now() - start,
      status: "failed",
      error: err,
    });
    return {
      status: "failed",
      changedFields: [],
      prev: rowToSnapshot(listing),
      next: empty,
      durationMs: Date.now() - start,
      error: err,
    };
  }

  const prev = rowToSnapshot(listing);
  const next = vehicleToSnapshot(fresh);
  const changedFields: ChangedField[] = [];

  for (const field of VOLATILE_FIELDS) {
    const from = prev[field];
    const to = next[field];
    if (!valuesEqual(from, to)) {
      changedFields.push({ field, from: from ?? null, to: to ?? null });
    }
  }

  const duration = Date.now() - start;

  if (changedFields.length === 0) {
    await safeBumpLastRefreshed(listingId, []);
    await safeInsertRun(listingId, {
      changedFields: [],
      prev,
      next,
      durationMs: duration,
      status: "unchanged",
    });
    log("info", `[refresh] listing ${listingId} unchanged (${duration}ms)`);
    return {
      status: "unchanged",
      changedFields: [],
      prev,
      next,
      durationMs: duration,
    };
  }

  await safeApplyUpdates(listingId, changedFields, next);
  await safeBumpLastRefreshed(listingId, changedFields);
  await safeInsertRun(listingId, {
    changedFields,
    prev,
    next,
    durationMs: duration,
    status: "success",
  });

  log(
    "success",
    `[refresh] listing ${listingId}: ${changedFields.length} field(s) changed (${duration}ms)`
  );
  return { status: "success", changedFields, prev, next, durationMs: duration };
}

// ── Helpers ────────────────────────────────────────────────────────────

function withTimeout<T>(p: Promise<T>, ms: number, msg: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(msg)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  if (typeof a === "number" && typeof b === "number") {
    return Math.abs(a - b) < 0.0001;
  }
  return String(a) === String(b);
}

function rowToSnapshot(row: ListingRow): Record<string, unknown> {
  return {
    price: row.price,
    bin_price: row.bin_price,
    auction_time_left: row.auction_time_left,
    mileage: row.mileage,
    image_url: row.image_url,
    primary_damage: row.primary_damage,
    title_status: row.title_status,
    auction_location: row.auction_location,
  };
}

function vehicleToSnapshot(v: NormalizedVehicle): Record<string, unknown> {
  return {
    price: v.currentBid ?? v.askingPrice ?? null,
    bin_price: v.buyNowPrice ?? null,
    auction_time_left: v.auctionDate ?? null,
    mileage: v.odometer ?? null,
    image_url: v.thumbnailUrl ?? v.images?.[0] ?? null,
    primary_damage: v.primaryDamage ?? null,
    title_status: v.titleType ?? null,
    auction_location: v.auctionLocation ?? null,
  };
}

async function safeApplyUpdates(
  listingId: string,
  changed: ChangedField[],
  next: Record<string, unknown>
): Promise<void> {
  if (changed.length === 0) return;
  const c = getClient();
  const updates: Record<string, unknown> = {
    source_updated_at: new Date().toISOString(),
  };
  for (const cf of changed) {
    updates[cf.field] = next[cf.field] ?? null;
  }
  const { error } = await c.from("listings").update(updates).eq("id", listingId);
  if (error) {
    log("error", `[refresh] update failed for ${listingId}: ${error.message}`);
  }
}

async function safeBumpLastRefreshed(
  listingId: string,
  changedFields: ChangedField[]
): Promise<void> {
  const c = getClient();
  const { error } = await c
    .from("listings")
    .update({
      last_refreshed_at: new Date().toISOString(),
      last_refresh_diff: changedFields,
    })
    .eq("id", listingId);
  if (error) log("warn", `[refresh] bump last_refreshed_at: ${error.message}`);
}

async function safeInsertRun(
  listingId: string,
  entry: {
    changedFields: ChangedField[];
    prev: Record<string, unknown>;
    next: Record<string, unknown>;
    durationMs: number;
    status: string;
    error?: string;
  }
): Promise<void> {
  const c = getClient();
  const { error } = await c.from("listing_refresh_runs").insert({
    listing_id: listingId,
    changed_fields: entry.changedFields,
    prev_snapshot: entry.prev,
    new_snapshot: entry.next,
    duration_ms: entry.durationMs,
    status: entry.status,
    error: entry.error ?? null,
  });
  if (error) log("warn", `[refresh] insert run: ${error.message}`);
}
