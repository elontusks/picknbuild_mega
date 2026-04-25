/**
 * Daily ingestion job — pulls the top 10 "hottest" listings from each active
 * source adapter (Copart, IAAI, ...) and populates the curated_listings table
 * that drives the homepage "Hottest Auctions" feed.
 *
 * Scheduled via node-cron (default 04:00 daily, override with INGEST_CRON env).
 * Can also be invoked manually via the POST /ingest/run route or by importing
 * runDailyIngest() directly (for tests).
 */

import cron from "node-cron";
import type { Orchestrator } from "../core/orchestrator.js";
import {
  getSiteForAdapter,
  log,
  withRetry,
  insertCuratedBatch,
  markBatchExpired,
} from "../core/index.js";

const DEFAULT_LIMIT = 10;

export interface IngestResult {
  source: string;
  siteId: string | null;
  inserted: number;
  expired: number;
  error?: string;
}

/**
 * Run a full ingestion pass across all ready adapters.
 * For each adapter: fetch top-N hottest, mark previous batch expired,
 * then insert the new batch. Each adapter is wrapped in withRetry so a
 * transient anti-bot failure doesn't kill the whole run.
 */
export async function runDailyIngest(
  orchestrator: Orchestrator,
  limit: number = DEFAULT_LIMIT
): Promise<IngestResult[]> {
  const adapters = orchestrator.getReadyAdapters();

  if (adapters.length === 0) {
    log("warn", "[ingest] No ready adapters — skipping");
    return [];
  }

  log("info", `[ingest] Starting daily ingest across ${adapters.length} adapter(s): ${adapters.map((a) => a.name).join(", ")}`);

  const results: IngestResult[] = [];

  // Sequential (not parallel) — browser-based adapters (Playwright) share
  // limited system resources and hammering all at once invites anti-bot flags.
  for (const adapter of adapters) {
    const site = await getSiteForAdapter(adapter.name);
    if (!site) {
      log("warn", `[ingest] No scrape_site row for adapter "${adapter.name}" — skipping`);
      results.push({ source: adapter.name, siteId: null, inserted: 0, expired: 0, error: "no site" });
      continue;
    }

    try {
      const vehicles = await withRetry(
        () => adapter.fetchHottest(limit),
        3,
        2000,
        `[ingest] ${adapter.name} fetchHottest`
      );

      if (vehicles.length === 0) {
        log("warn", `[ingest] ${adapter.name} returned 0 vehicles — skipping batch`);
        results.push({ source: adapter.name, siteId: site.id, inserted: 0, expired: 0 });
        continue;
      }

      const expired = await markBatchExpired(site.id);
      const inserted = await insertCuratedBatch(site, vehicles.slice(0, limit));

      log("success", `[ingest] ${adapter.name}: expired ${expired}, inserted ${inserted}`);
      results.push({ source: adapter.name, siteId: site.id, inserted, expired });
    } catch (err: any) {
      log("error", `[ingest] ${adapter.name} failed: ${err.message}`);
      results.push({
        source: adapter.name,
        siteId: site.id,
        inserted: 0,
        expired: 0,
        error: err.message,
      });
    }
  }

  log("success", `[ingest] Daily ingest complete: ${JSON.stringify(results)}`);
  return results;
}

/**
 * Schedule the daily ingest cron job.
 * Returns a handle so the caller can stop it (mostly for tests).
 */
export function scheduleDailyIngest(orchestrator: Orchestrator): cron.ScheduledTask | null {
  if (process.env.DISABLE_INGEST_CRON === "1") {
    log("info", "[ingest] DISABLE_INGEST_CRON=1 — cron disabled");
    return null;
  }

  const schedule = process.env.INGEST_CRON ?? "0 4 * * *";

  if (!cron.validate(schedule)) {
    log("error", `[ingest] Invalid INGEST_CRON "${schedule}" — cron disabled`);
    return null;
  }

  const task = cron.schedule(schedule, async () => {
    log("info", `[ingest] Cron fired (schedule: ${schedule})`);
    try {
      await runDailyIngest(orchestrator);
    } catch (err: any) {
      log("error", `[ingest] Cron run failed: ${err.message}`);
    }
  });

  log("success", `[ingest] Daily ingest cron scheduled (${schedule})`);
  return task;
}
