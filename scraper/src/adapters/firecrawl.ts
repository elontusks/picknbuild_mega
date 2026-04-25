/**
 * Firecrawl-based adapter for dealer/marketplace sites.
 *
 * Uses Firecrawl's LLM extraction to scrape search results pages
 * and individual listings. Each instance is tied to a specific site
 * (e.g., Cars.com) via a search URL template.
 *
 * Unlike the Playwright adapters (Copart, IAAI), this adapter:
 * - Doesn't manage a browser session
 * - Uses LLM extraction with a schema (same as web app's scraper.ts)
 * - Supports FC specification for site-specific guidance
 */

import FirecrawlApp from "@mendable/firecrawl-js";
import type { SourceAdapter } from "../core/adapter.js";
import type {
  NormalizedVehicle,
  SearchFilters,
  AdapterConfig,
} from "../core/types.js";
import { buildExtractionPrompt } from "../core/fc-spec.js";
import { log, withRetry } from "../core/utils.js";

// ── Extraction schemas ────────────────────────────────────────────────

/** Schema for extracting multiple listings from a search results page */
const SEARCH_RESULTS_SCHEMA = {
  type: "object" as const,
  properties: {
    listings: {
      type: "array" as const,
      description: "Array of vehicle listings found on this search results page",
      items: {
        type: "object" as const,
        properties: {
          source_listing_id: { type: "string", description: "Unique listing ID from the source site" },
          title: { type: "string", description: "Full listing title, e.g. '2019 Toyota Camry SE'" },
          make: { type: "string", description: "Vehicle manufacturer" },
          model: { type: "string", description: "Vehicle model" },
          year: { type: "number", description: "Model year" },
          price: { type: "number", description: "Listed price in USD (number only)" },
          mileage: { type: "number", description: "Odometer reading in miles (number only)" },
          location: { type: "string", description: "Vehicle location (city, state)" },
          image_url: { type: "string", description: "URL of the primary vehicle image" },
          listing_url: { type: "string", description: "Full URL to the individual listing page" },
          title_status: { type: "string", description: "Title status: clean, salvage, rebuilt, etc." },
          vin: { type: "string", description: "17-character VIN if visible" },
          engine: { type: "string", description: "Engine description" },
          transmission: { type: "string", description: "Transmission type" },
          drive_type: { type: "string", description: "Drivetrain: FWD, RWD, AWD, 4WD" },
          fuel_type: { type: "string", description: "Fuel type: gasoline, diesel, electric, hybrid" },
          color: { type: "string", description: "Exterior color" },
        },
        required: ["title"],
      },
    },
  },
  required: ["listings"],
};

/** Schema for extracting a single listing's details */
const DETAIL_SCHEMA = {
  type: "object" as const,
  properties: {
    source_listing_id: { type: "string", description: "Unique listing ID from the source site" },
    title: { type: "string", description: "Full listing title" },
    make: { type: "string", description: "Vehicle manufacturer" },
    model: { type: "string", description: "Vehicle model" },
    year: { type: "number", description: "Model year" },
    price: { type: "number", description: "Listed price in USD (number only)" },
    buy_now_price: { type: "number", description: "Buy-it-now price if available" },
    mileage: { type: "number", description: "Odometer reading in miles (number only)" },
    location: { type: "string", description: "Vehicle location" },
    image_url: { type: "string", description: "Primary vehicle image URL" },
    title_status: { type: "string", description: "Title status" },
    vehicle_condition: { type: "string", description: "Condition: run and drive, starts, etc." },
    vin: { type: "string", description: "17-character VIN" },
    engine: { type: "string", description: "Engine description" },
    transmission: { type: "string", description: "Transmission type" },
    drive_type: { type: "string", description: "Drivetrain" },
    fuel_type: { type: "string", description: "Fuel type" },
    color: { type: "string", description: "Exterior color" },
    has_keys: { type: "string", description: "'yes', 'no', or empty" },
    primary_damage: { type: "string", description: "Primary damage description" },
    secondary_damage: { type: "string", description: "Secondary damage description" },
  },
  required: ["title"],
};

// ── Adapter ───────────────────────────────────────────────────────────

interface RawListing {
  source_listing_id?: string;
  title?: string;
  make?: string;
  model?: string;
  year?: number | string;
  price?: number | string;
  mileage?: number | string;
  location?: string;
  image_url?: string;
  listing_url?: string;
  title_status?: string;
  vin?: string;
  engine?: string;
  transmission?: string;
  drive_type?: string;
  fuel_type?: string;
  color?: string;
  buy_now_price?: number | string;
  vehicle_condition?: string;
  has_keys?: string;
  primary_damage?: string;
  secondary_damage?: string;
}

export class FirecrawlAdapter implements SourceAdapter {
  readonly name: string;
  readonly type = "firecrawl" as const;

  private client: FirecrawlApp | null = null;
  private ready = false;
  private config: AdapterConfig | null = null;
  private fcSpec: string | null = null;

  constructor(
    private siteName: string,
    private baseUrl: string,
    private searchUrlTemplate: string
  ) {
    // Use baseUrl as the adapter name (e.g., "cars.com")
    this.name = baseUrl;
  }

  /** Set the FC specification for this site (loaded from DB) */
  setFcSpec(spec: string | null): void {
    this.fcSpec = spec;
  }

  async init(config: AdapterConfig): Promise<void> {
    this.config = config;
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      log("warn", `${this.siteName}: FIRECRAWL_API_KEY not set, adapter disabled`);
      this.ready = false;
      return;
    }
    this.client = new FirecrawlApp({ apiKey });
    this.ready = true;
    log("success", `${this.siteName} (Firecrawl) initialized`);
  }

  async search(filters: SearchFilters): Promise<NormalizedVehicle[]> {
    if (!this.client || !this.ready) return [];

    const searchUrl = this.buildSearchUrl(filters);
    if (!searchUrl) {
      log("warn", `${this.siteName}: could not build search URL (missing make)`);
      return [];
    }

    log("info", `${this.siteName}: scraping ${searchUrl}`);

    const prompt = buildExtractionPrompt(this.fcSpec) +
      "\n\nExtract ALL vehicle listings visible on this search results page. " +
      "Return them as an array in the 'listings' field.";

    try {
      const response = await withRetry(
        () => this.client!.scrape(searchUrl, {
          formats: [
            {
              type: "json" as const,
              prompt,
              schema: SEARCH_RESULTS_SCHEMA,
            },
          ],
        }),
        2,
        3000,
        `${this.siteName} search`
      );

      if (!response?.json) {
        log("warn", `${this.siteName}: empty response`);
        return [];
      }

      const raw = response.json as { listings?: RawListing[] };
      const listings = raw.listings ?? [];

      log("info", `${this.siteName}: extracted ${listings.length} listings`);

      return listings
        .map((l, i) => this.normalize(l, searchUrl, i))
        .filter((v): v is NormalizedVehicle => v !== null);
    } catch (err: any) {
      log("error", `${this.siteName} search failed: ${err.message}`);
      return [];
    }
  }

  async getDetails(sourceId: string): Promise<NormalizedVehicle | null> {
    if (!this.client || !this.ready) return null;

    // sourceId for Firecrawl adapters is the full listing URL
    const url = sourceId.startsWith("http") ? sourceId : `https://${this.baseUrl}/${sourceId}`;

    log("info", `${this.siteName}: fetching details for ${url}`);

    const prompt = buildExtractionPrompt(this.fcSpec);

    try {
      const response = await withRetry(
        () => this.client!.scrape(url, {
          formats: [
            {
              type: "json" as const,
              prompt,
              schema: DETAIL_SCHEMA,
            },
            "images",
          ],
        }),
        2,
        3000,
        `${this.siteName} details`
      );

      if (!response?.json) return null;

      const raw = response.json as RawListing;
      const pageImages = (response.images ?? []) as string[];
      return this.normalizeDetail(raw, url, pageImages);
    } catch (err: any) {
      log("error", `${this.siteName} details failed: ${err.message}`);
      return null;
    }
  }

  isReady(): boolean {
    return this.ready;
  }

  async close(): Promise<void> {
    this.ready = false;
  }

  /**
   * Firecrawl adapters (dealer sites / classifieds) have no natural "hotness"
   * signal comparable to auction watch counts, so the curated-feed ingest
   * job skips them by default.
   */
  async fetchHottest(_limit: number): Promise<NormalizedVehicle[]> {
    return [];
  }

  // ── Internal ────────────────────────────────────────────────────────

  private buildSearchUrl(filters: SearchFilters): string | null {
    if (!filters.make) return null;

    let url = this.searchUrlTemplate;
    url = url.replace(/\{make\}/g, encodeURIComponent(filters.make));
    url = url.replace(/\{model\}/g, filters.model ? encodeURIComponent(filters.model) : "");
    url = url.replace(/\{price\}/g, filters.yearFrom ? String(filters.yearFrom) : "");

    // Handle year range
    if (filters.yearFrom) url = url.replace(/\{yearFrom\}/g, String(filters.yearFrom));
    if (filters.yearTo) url = url.replace(/\{yearTo\}/g, String(filters.yearTo));

    // Handle location/zip
    url = url.replace(/\{zip\}/g, "43215"); // default to Columbus OH
    url = url.replace(/\{location\}/g, filters.location ?? "");

    // Handle price
    if (filters.odometerMax) url = url.replace(/\{mileage\}/g, String(filters.odometerMax));

    // Clean up any remaining unreplaced placeholders
    url = url.replace(/\{[^}]+\}/g, "");

    return url;
  }

  /**
   * Normalize a listing from search results to NormalizedVehicle.
   */
  private normalize(
    raw: RawListing,
    searchUrl: string,
    index: number
  ): NormalizedVehicle | null {
    const make = str(raw.make);
    const model = str(raw.model);
    const year = int(raw.year);

    // Need at least make + model or title
    if (!make && !model && !raw.title) return null;

    const sourceId = raw.source_listing_id ?? raw.listing_url ?? `${this.baseUrl}-${index}`;

    return {
      source: this.name,
      sourceId,
      sourceUrl: raw.listing_url ?? searchUrl,
      vin: sanitizeVin(str(raw.vin)) ?? "",
      make: make ?? extractFromTitle(raw.title, "make") ?? "",
      model: model ?? extractFromTitle(raw.title, "model") ?? "",
      year: year ?? extractYearFromTitle(raw.title) ?? 0,
      odometer: int(raw.mileage) ?? 0,
      titleType: str(raw.title_status),
      askingPrice: num(raw.price),
      driveType: str(raw.drive_type),
      engineType: str(raw.engine),
      transmission: str(raw.transmission),
      fuelType: str(raw.fuel_type),
      exteriorColor: str(raw.color),
      auctionLocation: str(raw.location),
      images: raw.image_url ? [raw.image_url] : [],
      thumbnailUrl: str(raw.image_url),
      scrapedAt: new Date().toISOString(),
    };
  }

  /**
   * Normalize a detail page response to NormalizedVehicle.
   */
  private normalizeDetail(
    raw: RawListing,
    url: string,
    pageImages: string[]
  ): NormalizedVehicle {
    const vehicleImages = filterVehicleImages(pageImages);
    const primaryImage = str(raw.image_url) ?? vehicleImages[0];

    return {
      source: this.name,
      sourceId: raw.source_listing_id ?? url,
      sourceUrl: url,
      vin: sanitizeVin(str(raw.vin)) ?? "",
      make: str(raw.make) ?? "",
      model: str(raw.model) ?? "",
      year: int(raw.year) ?? 0,
      odometer: int(raw.mileage) ?? 0,
      titleType: str(raw.title_status),
      primaryDamage: str(raw.primary_damage),
      secondaryDamage: str(raw.secondary_damage),
      hasKeys: raw.has_keys === "yes" ? true : raw.has_keys === "no" ? false : undefined,
      askingPrice: num(raw.price),
      buyNowPrice: num(raw.buy_now_price),
      driveType: str(raw.drive_type),
      engineType: str(raw.engine),
      transmission: str(raw.transmission),
      fuelType: str(raw.fuel_type),
      exteriorColor: str(raw.color),
      auctionLocation: str(raw.location),
      images: vehicleImages.length > 0 ? vehicleImages : primaryImage ? [primaryImage] : [],
      thumbnailUrl: primaryImage,
      scrapedAt: new Date().toISOString(),
    };
  }
}

// ── Helpers ────────────────────────────────────────────────────────────

function str(v: unknown): string | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  return String(v).trim();
}

function num(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const n = typeof v === "string" ? parseFloat(v.replace(/[,$]/g, "")) : Number(v);
  return isNaN(n) ? undefined : n;
}

function int(v: unknown): number | undefined {
  const n = num(v);
  return n !== undefined ? Math.round(n) : undefined;
}

function sanitizeVin(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const clean = v.replace(/[^A-HJ-NPR-Z0-9]/gi, "").toUpperCase();
  return clean.length === 17 ? clean : v.toUpperCase().trim();
}

function extractFromTitle(title: string | undefined, field: "make" | "model"): string | undefined {
  if (!title) return undefined;
  // Pattern: "2019 Toyota Camry SE" → year make model trim
  const parts = title.trim().split(/\s+/);
  if (parts.length < 3) return undefined;
  // Skip leading year if present
  const startIdx = /^\d{4}$/.test(parts[0]) ? 1 : 0;
  if (field === "make" && parts.length > startIdx) return parts[startIdx];
  if (field === "model" && parts.length > startIdx + 1) return parts[startIdx + 1];
  return undefined;
}

function extractYearFromTitle(title: string | undefined): number | undefined {
  if (!title) return undefined;
  const match = title.match(/\b(19|20)\d{2}\b/);
  return match ? parseInt(match[0], 10) : undefined;
}

function filterVehicleImages(images: string[]): string[] {
  const skipPatterns = [
    /logo/i, /icon/i, /favicon/i, /badge/i, /sprite/i,
    /tracking/i, /pixel/i, /analytics/i, /beacon/i,
    /\.svg$/i, /\.gif$/i,
    /1x1/i, /spacer/i, /avatar/i, /profile/i,
    /social/i, /facebook/i, /twitter/i, /instagram/i,
    /google.*tag/i, /doubleclick/i, /adsense/i,
  ];

  return images.filter((img) => {
    if (!img.startsWith("http")) return false;
    if (skipPatterns.some((p) => p.test(img))) return false;
    return true;
  });
}
