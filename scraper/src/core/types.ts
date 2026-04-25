// ─── Normalized Vehicle (shared output from all adapters) ───────────────────

export interface NormalizedVehicle {
  // Identity
  source: string;
  sourceId: string;
  sourceUrl: string;
  vin: string;

  // Vehicle info
  make: string;
  model: string;
  year: number;
  trim?: string;
  bodyStyle?: string;
  exteriorColor?: string;
  interiorColor?: string;
  engineType?: string;
  cylinders?: string;
  transmission?: string;
  driveType?: string;
  fuelType?: string;
  odometer: number;
  odometerBrand?: string;       // ACTUAL / NOT ACTUAL / EXEMPT / TMU — affects resale

  // Condition & title
  titleType?: string;
  titleState?: string;
  primaryDamage?: string;
  secondaryDamage?: string;
  lossType?: string;            // COLLISION / FLOOD / FIRE / THEFT RECOVERY — distinct from damage
  startCode?: string;           // "Run & Drive" / "Starts" / "Doesn't Run"
  hasKeys?: boolean;

  // Pricing — adapters populate whichever fields apply
  currentBid?: number;
  askingPrice?: number;
  buyNowPrice?: number | null;
  actualCashValue?: number;     // ACV pre-loss (insurance value)
  estimatedRetailValue?: number;
  estimatedRepairCost?: number;
  damageEstimate?: number;

  // Auction-specific
  lotNumber?: string;           // public lot number (may differ from sourceId)
  auctionDate?: string;
  auctionTimezone?: string;
  auctionLocation?: string;
  seller?: string;
  sellerType?: string;          // INSURANCE / LEASE / DEALER / RENTAL

  // Activity signals — drive "hottest" ranking
  watchCount?: number;
  bidCount?: number;

  // Media
  images: string[];
  thumbnailUrl?: string;

  // Curation / hotness (populated by fetchHottest)
  hotnessScore?: number;

  // Meta
  scrapedAt: string;
}

// ─── Search Filters (passed to every adapter) ──────────────────────────────

export interface SearchFilters {
  make?: string;
  model?: string;
  yearFrom?: number;
  yearTo?: number;
  odometerMax?: number;
  titleType?: string;
  damageType?: string;
  bodyStyle?: string;
  fuelType?: string;
  driveType?: string;
  transmission?: string;
  color?: string;
  buyNowOnly?: boolean;
  location?: string;
}

// ─── User Preferences (from the frontend, used for scoring) ────────────────

export interface UserPreferences {
  make?: string;
  model?: string;
  year?: number | string;
  mileage?: number | string;
  price?: number | string;
  titleStatus?: string;
  state?: string;
  maxPages?: number;
  pageSize?: number;
}

// ─── Scored Vehicle (after ranking) ────────────────────────────────────────

export interface ScoredVehicle extends NormalizedVehicle {
  matchScore: number;
}

// ─── Adapter Config ────────────────────────────────────────────────────────

export interface AdapterConfig {
  /** Max pages to paginate through per search */
  maxPages: number;
  /** Results per page */
  pageSize: number;
  /** Delay between requests in ms */
  delayBetweenRequests: number;
  /** Max retries per request */
  maxRetries: number;
  /** Run browser headless (Playwright adapters) */
  headless: boolean;
}

export const DEFAULT_ADAPTER_CONFIG: AdapterConfig = {
  maxPages: 3,
  pageSize: 20,
  delayBetweenRequests: 1500,
  maxRetries: 3,
  headless: true,
};
