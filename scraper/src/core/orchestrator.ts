import { SourceAdapter } from "./adapter.js";
import {
  NormalizedVehicle,
  ScoredVehicle,
  SearchFilters,
  UserPreferences,
  AdapterConfig,
  DEFAULT_ADAPTER_CONFIG,
} from "./types.js";
import { scoreAndSort } from "./scoring.js";
import { buildFcSpecUpdate } from "./fc-spec.js";
import {
  getSiteForAdapter,
  insertOrUpdateListing,
  logScrapeRun,
  updateSiteFcSpec,
  getSiteFcSpec,
} from "./db.js";
import { log } from "./utils.js";

/**
 * The orchestrator fans out searches to all registered adapters,
 * merges/deduplicates results, and scores them against user preferences.
 */
export class Orchestrator {
  private adapters: Map<string, SourceAdapter> = new Map();
  private config: AdapterConfig;

  constructor(config: Partial<AdapterConfig> = {}) {
    this.config = { ...DEFAULT_ADAPTER_CONFIG, ...config };
  }

  /**
   * Register an adapter. Call init() separately — the orchestrator
   * doesn't auto-init so you can control startup order.
   */
  register(adapter: SourceAdapter): void {
    if (this.adapters.has(adapter.name)) {
      log("warn", `Adapter "${adapter.name}" already registered, replacing`);
    }
    this.adapters.set(adapter.name, adapter);
    log("info", `Registered adapter: ${adapter.name} (${adapter.type})`);
  }

  /**
   * Initialize all registered adapters.
   */
  async initAll(): Promise<void> {
    const tasks = [...this.adapters.values()].map(async (adapter) => {
      try {
        await adapter.init(this.config);
        log("success", `${adapter.name} initialized`);
      } catch (err: any) {
        log("error", `${adapter.name} failed to init: ${err.message}`);
      }
    });
    await Promise.allSettled(tasks);
  }

  /**
   * Fan out a search to all ready adapters, merge and deduplicate results.
   */
  async search(
    prefs: UserPreferences
  ): Promise<ScoredVehicle[]> {
    const filters = this.prefsToFilters(prefs);
    const readyAdapters = [...this.adapters.values()].filter((a) => a.isReady());

    if (readyAdapters.length === 0) {
      log("warn", "No adapters are ready");
      return [];
    }

    log("info", `Searching ${readyAdapters.length} source(s): ${readyAdapters.map((a) => a.name).join(", ")}`);

    // Fan out to all adapters in parallel
    const results = await Promise.allSettled(
      readyAdapters.map((adapter) =>
        adapter.search(filters).then((vehicles) => ({
          source: adapter.name,
          vehicles,
        }))
      )
    );

    // Collect successful results
    const allVehicles: NormalizedVehicle[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        log("success", `${result.value.source}: ${result.value.vehicles.length} results`);
        allVehicles.push(...result.value.vehicles);
      } else {
        log("error", `Adapter failed: ${result.reason}`);
      }
    }

    // Deduplicate by VIN (keep the entry with more data)
    const deduped = this.deduplicateByVin(allVehicles);
    log("info", `${allVehicles.length} total → ${deduped.length} after dedup`);

    // Score and rank
    const scored = scoreAndSort(deduped, prefs);

    // Persist results to DB (fire-and-forget; don't block the search response)
    void this.persistResults(scored, readyAdapters.map((a) => a.name)).catch(
      (err: unknown) => log("error", `persistResults failed: ${String(err)}`)
    );

    return scored;
  }

  /**
   * Fetch details for a single vehicle, routing to the correct adapter.
   */
  async getDetails(
    source: string,
    sourceId: string
  ): Promise<NormalizedVehicle | null> {
    const adapter = this.adapters.get(source);
    if (!adapter?.isReady()) {
      log("warn", `Adapter "${source}" not available`);
      return null;
    }
    return adapter.getDetails(sourceId);
  }

  /**
   * Expose the adapter registry for jobs/workers that need to iterate over
   * ready adapters (e.g. the daily ingestion job).
   */
  getReadyAdapters(): SourceAdapter[] {
    return [...this.adapters.values()].filter((a) => a.isReady());
  }

  /**
   * Fetch the hottest N listings from a specific adapter.
   * Returns empty array if the adapter isn't registered or ready.
   */
  async fetchHottestFor(
    source: string,
    limit: number
  ): Promise<NormalizedVehicle[]> {
    const adapter = this.adapters.get(source);
    if (!adapter?.isReady()) {
      log("warn", `Adapter "${source}" not available for hottest fetch`);
      return [];
    }
    return adapter.fetchHottest(limit);
  }

  /**
   * Shut down all adapters.
   */
  async closeAll(): Promise<void> {
    const tasks = [...this.adapters.values()].map((a) => a.close().catch(() => {}));
    await Promise.allSettled(tasks);
    log("info", "All adapters closed");
  }

  /**
   * List registered adapters and their status.
   */
  status(): Array<{ name: string; type: string; ready: boolean }> {
    return [...this.adapters.values()].map((a) => ({
      name: a.name,
      type: a.type,
      ready: a.isReady(),
    }));
  }

  // ── DB persistence ──

  /**
   * Best-effort persistence of search results to Postgres.
   * Upserts listings, logs scrape runs, and evolves FC specs per source.
   */
  private async persistResults(
    vehicles: ScoredVehicle[],
    adapterNames: string[]
  ): Promise<void> {
    try {
      const bySource = new Map<string, ScoredVehicle[]>();
      for (const v of vehicles) {
        const list = bySource.get(v.source) ?? [];
        list.push(v);
        bySource.set(v.source, list);
      }

      for (const adapterName of adapterNames) {
        const site = await getSiteForAdapter(adapterName);
        if (!site) {
          log("warn", `No scrape_site found for adapter "${adapterName}", skipping DB persist`);
          continue;
        }

        const sourceVehicles = bySource.get(adapterName) ?? [];

        const allMissing = new Set<string>();
        for (const v of sourceVehicles) {
          if (!v.vin) allMissing.add("vin");
          if (!v.make) allMissing.add("make");
          if (!v.model) allMissing.add("model");
          if (!v.year) allMissing.add("year");
          if (!v.odometer) allMissing.add("mileage");
          if (!v.titleType) allMissing.add("title_status");
          if (!v.auctionLocation) allMissing.add("location");
          if (v.currentBid == null && v.askingPrice == null) allMissing.add("price");
        }

        for (const v of sourceVehicles) {
          try {
            await insertOrUpdateListing(site, v, v.matchScore);
          } catch (err: any) {
            log("warn", `Failed to upsert listing ${v.sourceId}: ${err.message}`);
          }
        }

        const missingArr = [...allMissing];
        const status = sourceVehicles.length === 0
          ? "failed" as const
          : missingArr.length > 0
            ? "partial" as const
            : "success" as const;

        await logScrapeRun(site.id, null, {
          url: `orch://${adapterName}/search`,
          status,
          missingFields: missingArr.length > 0 ? missingArr : undefined,
          durationMs: undefined,
        });

        const existingSpec = await getSiteFcSpec(site.id);
        const updatedSpec = buildFcSpecUpdate(existingSpec, {
          success: sourceVehicles.length > 0,
          missingFields: missingArr.length > 0 ? missingArr : undefined,
          url: `orch://${adapterName}/search`,
        });
        await updateSiteFcSpec(site.id, updatedSpec);

        log("info", `Persisted ${sourceVehicles.length} listings for ${adapterName} (site ${site.id})`);
      }
    } catch (err: any) {
      log("error", `DB persist failed (non-fatal): ${err.message}`);
    }
  }

  // ── Internal helpers ──

  private prefsToFilters(prefs: UserPreferences): SearchFilters {
    const filters: SearchFilters = {};

    if (prefs.make) filters.make = prefs.make;
    if (prefs.model) filters.model = prefs.model;

    if (prefs.year) {
      const y = Number(prefs.year);
      if (!isNaN(y)) {
        filters.yearFrom = y - 3;
        filters.yearTo = y + 1;
      }
    }

    if (prefs.titleStatus) filters.titleType = prefs.titleStatus;
    if (prefs.state) filters.location = prefs.state;

    return filters;
  }

  /**
   * Deduplicate vehicles by VIN.
   * When the same VIN appears from multiple sources, keep the entry
   * with more populated fields. Merge images from both.
   */
  private deduplicateByVin(vehicles: NormalizedVehicle[]): NormalizedVehicle[] {
    const byVin = new Map<string, NormalizedVehicle>();

    for (const v of vehicles) {
      // Vehicles without a VIN can't be deduped — keep them all
      if (!v.vin) {
        byVin.set(`no-vin-${v.source}-${v.sourceId}`, v);
        continue;
      }

      const existing = byVin.get(v.vin);
      if (!existing) {
        byVin.set(v.vin, v);
        continue;
      }

      // Merge: keep whichever has more fields, combine images
      const existingFields = Object.values(existing).filter((val) => val != null && val !== "").length;
      const newFields = Object.values(v).filter((val) => val != null && val !== "").length;

      const merged = newFields > existingFields ? { ...existing, ...v } : { ...v, ...existing };

      // Combine images from both sources, deduplicate
      const allImages = [...new Set([...existing.images, ...v.images])];
      merged.images = allImages;

      byVin.set(v.vin, merged);
    }

    return [...byVin.values()];
  }
}
