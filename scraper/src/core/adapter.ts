import { NormalizedVehicle, SearchFilters, AdapterConfig } from "./types.js";

/**
 * Every source adapter implements this interface.
 *
 * Playwright adapters (Copart, IAAI): manage a browser session internally.
 * Firecrawl adapters (Cars.com, dealers): call Firecrawl's API with a schema.
 *
 * The orchestrator only talks to this interface — it never knows
 * source-specific details like field names or anti-bot strategies.
 */
export interface SourceAdapter {
  /** Unique adapter name, e.g. "copart", "iaai", "cargurus" */
  readonly name: string;

  /** "playwright" for browser-based, "firecrawl" for LLM extraction */
  readonly type: "playwright" | "firecrawl";

  /**
   * Initialize the adapter.
   * Playwright adapters: launch browser, navigate to site, establish session.
   * Firecrawl adapters: validate API key, warm up connection.
   */
  init(config: AdapterConfig): Promise<void>;

  /**
   * Search for vehicles matching the given filters.
   * Returns normalized results — the orchestrator doesn't need to know
   * how the source represents its data internally.
   */
  search(filters: SearchFilters): Promise<NormalizedVehicle[]>;

  /**
   * Fetch full details for a single vehicle by its source-specific ID.
   * Returns null if not found.
   */
  getDetails(sourceId: string): Promise<NormalizedVehicle | null>;

  /**
   * Fetch the "hottest" listings from this source — sorted by a source-specific
   * hotness signal (watch count, bid activity, timer urgency) descending.
   * Used by the daily ingestion job to populate the curated homepage feed.
   */
  fetchHottest(limit: number): Promise<NormalizedVehicle[]>;

  /**
   * Whether the adapter is initialized and ready to accept requests.
   */
  isReady(): boolean;

  /**
   * Tear down resources (close browser, etc.).
   */
  close(): Promise<void>;
}
