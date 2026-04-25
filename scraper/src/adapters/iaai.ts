import { chromium, Browser, BrowserContext, Page } from "playwright";
import { SourceAdapter } from "../core/adapter.js";
import { NormalizedVehicle, SearchFilters, AdapterConfig } from "../core/types.js";
import { log, sleep, jitteredDelay, withRetry } from "../core/utils.js";

// ─── IAAI endpoint paths ────────────────────────────────────────────────────
//
// Unlike Copart, IAAI does NOT expose a clean JSON-returning internal API.
// Everything is server-rendered HTML, with some embedded JSON blobs:
//
//   • /Search?Make=X&Model=Y&...
//       Returns an HTML page. Each result is a `<div class="table-row table-row-border">`
//       card containing an anchor to `/VehicleDetail/{inventoryId}~{tenant}` and
//       `<li class="data-list__item">` entries for stock, damage, odometer, etc.
//       Pagination uses the `?page={n}` query parameter (1-indexed).
//
//   • /VehicleDetail/{inventoryId}~{tenant}
//       Returns an HTML page with a `<script type="application/json" id="ProductDetailsVM">`
//       blob. The `inventoryView.attributes` object inside is a ~150-field
//       PascalCase JSON with everything: StockNumber, Year, Make, Model,
//       ODOValue, PrimaryDamageDesc, TitleBrand, AuctionDateTime, BranchName,
//       ExteriorColor, Keys, RunAndDrive, VIN, BodyStyleName, Segment, etc.
//       `auctionInformation.biddingInformation` / `.prebidInformation` hold
//       current-bid / buy-now / auction-status.
//
// Both pages are gated by PerimeterX (PX) — we warm the session in a real
// browser first, then navigate additional URLs in the SAME context so the PX
// cookies are reused.
//
// Verified endpoints confirmed DEAD (all return 404) and therefore NOT used:
//   POST /Search/SearchDetails
//   POST /Search/GetListings
//   POST /api/Search/Search
//   GET  /VehicleDetail/GetVehicleDetails/{id}

const IAAI_BASE = "https://www.iaai.com";
const SEARCH_URL = `${IAAI_BASE}/Search`;
const LOT_DETAILS_URL = (inventoryId: string) =>
  `${IAAI_BASE}/VehicleDetail/${inventoryId}`;

// Max concurrent pages used by getDetails-style bulk enrichment.
const MAX_CONCURRENT_TABS = 3;

// ─── IAAI data shape (extracted from detail HTML) ───────────────────────────
//
// Matches `inventoryView.attributes` inside the ProductDetailsVM JSON blob.
// All values come as strings from IAAI's .NET serializer — numbers, booleans,
// and dates all arrive as strings and must be coerced.

interface IaaiAttributes {
  // Identity
  Id?: string;                        // "{SalvageId}~{Tenant}"
  Tenant?: string;                    // "US"
  SalvageId?: string;                 // internal inventory id, e.g. "45184893"
  StockNumber?: string;               // public stock #, e.g. "44687778"

  // Vehicle
  Year?: string;
  Make?: string;
  Model?: string;
  Series?: string;
  InventoryType?: string;             // "AUTOMOBILE"
  InventoryCategory?: string;
  BodyStyleName?: string;
  Segment?: string;
  VehicleClass?: string;
  VIN?: string;                       // may be masked to "1N4AA6AP2HC******"
  VINStatus?: string;
  ExteriorColor?: string;
  InteriorColor?: string;
  EngineSize?: string;
  EngineInformation?: string;
  Cylinders?: string;
  CylindersDesc?: string;
  Transmission?: string;
  DriveLineTypeDesc?: string;
  FuelTypeDesc?: string;
  CountryOfOrigin?: string;

  // Condition
  ODOValue?: string;                  // odometer reading (string of integer)
  ODOBrand?: string;                  // "ACTUAL" / "NOT ACTUAL" / "EXEMPT" / "TMU"
  ODOUoM?: string;                    // "mi" / "km"
  PrimaryDamageCode?: string;
  PrimaryDamageDesc?: string;
  SecondaryDamageCode?: string;
  SecondaryDamageDesc?: string;
  LossTypeCode?: string;
  LossTypeDesc?: string;
  Keys?: string;                      // "True" / "False"
  KeyFOB?: string;
  StartsCode?: string;
  StartsDesc?: string;                // "Run & Drive" / "Starts" / "Does Not Run"
  RunAndDrive?: string;               // "True" / "False"
  AirbagState?: string;
  VehicleCondition?: string;

  // Title
  Title?: string;                     // document type
  TitleBrand?: string;                // " ", "SALVAGE", etc.
  TitleCode?: string;
  TitleState?: string;
  TitleStateName?: string;
  CertState?: string;
  WhoCanBuy?: string;

  // Pricing
  MinimumBidAmount?: string;

  // Location / auction
  BranchName?: string;
  BranchCode?: string;                // "427"
  BranchLink?: string;                // "427~US"
  BranchNumber?: string;
  BranchState?: string;
  LocName?: string;
  LocLongitude?: string;
  LocLatitude?: string;
  City?: string;
  State?: string;
  Zip?: string;
  AuctionDateTime?: string;           // "4/10/2026 2:30:00 PM +00:00"
  AuctionId?: string;
  TimedAuctionIndicator?: string;
  TimedAuctionCloseDateTime?: string;
  Origin?: string;

  // Media
  KeyImageLink?: string;
  LeadingImageID?: string;
  Link360?: string;
  EngineSoundLink?: string;
}

interface IaaiBiddingInformation {
  buyNowAmount?: number;
  buyNowPrice?: string;               // "$0"
  myCurrent?: string | null;
  buyNowInd?: boolean;
  timedAuctionInd?: boolean;
}

interface IaaiPrebidInformation {
  highBidAmount?: string;             // "$0"
  decimalHighBidAmount?: string;      // "0"
  liveDate?: string;
  auctionStatusDescription?: string;
  auctionStatus?: number;
}

interface IaaiProductDetails {
  inventoryView?: {
    attributes?: IaaiAttributes;
    imageDimensions?: {
      keys?: { $values?: Array<{ k?: string; sid?: number }> };
      image360Url?: string;
    };
  };
  auctionInformation?: {
    biddingInformation?: IaaiBiddingInformation;
    prebidInformation?: IaaiPrebidInformation;
  };
}

// Raw row parsed from the search HTML. Search cards expose less than the
// detail blob, so we pull what we can and let `getDetails()` fill the rest.
interface IaaiSearchRow {
  inventoryId: string;                // "45184893~US"
  stockNumber?: string;
  titleText?: string;                 // "2017 NISSAN MAXIMA 3.5 SR"
  detailUrl: string;                  // "/VehicleDetail/45184893~US"
  thumbnailUrl?: string;
  // Flattened `<li>` data-list items keyed by their visible label.
  fields: Record<string, string>;
}

// ─── Browser Session ────────────────────────────────────────────────────────

class IaaiSession {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private headless: boolean;

  constructor(headless: boolean) {
    this.headless = headless;
  }

  async init(): Promise<void> {
    log("info", "[iaai] Launching browser...");

    const channel = process.env.BROWSER_CHANNEL || undefined;
    this.browser = await chromium.launch({
      headless: this.headless,
      ...(channel ? { channel } : {}),
      args: [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-infobars",
        "--disable-dev-shm-usage",
      ],
    });

    this.context = await this.browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      viewport: { width: 1440, height: 900 },
      locale: "en-US",
      timezoneId: "America/New_York",
      javaScriptEnabled: true,
    });

    // Remove webdriver detection flag — PX checks for this.
    await this.context.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });

    this.page = await this.context.newPage();

    // Block heavy assets (keep scripts — PX needs them to resolve).
    await this.page.route(
      /\.(png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)$/,
      (route) => route.abort()
    );
    await this.page.route(
      /(google-analytics|gtm\.js|facebook\.com|doubleclick\.net|hotjar|segment)/,
      (route) => route.abort()
    );

    log("info", "[iaai] Navigating to IAAI search page...");
    try {
      await this.page.goto(SEARCH_URL, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
    } catch {
      log("warn", "[iaai] Search page timed out, trying homepage...");
      await this.page.goto(IAAI_BASE, {
        waitUntil: "commit",
        timeout: 45000,
      });
    }

    // PerimeterX challenge: first page load needs ~10-15s to settle.
    log("info", "[iaai] Waiting for PerimeterX challenge to resolve...");
    try {
      await this.page.waitForLoadState("networkidle", { timeout: 20000 });
    } catch {
      log("warn", "[iaai] networkidle timed out — proceeding anyway");
    }
    await sleep(12000);

    // Dismiss cookie consent if present — IAAI uses OneTrust like Copart.
    try {
      const btn = this.page.locator("#onetrust-accept-btn-handler");
      if (await btn.isVisible({ timeout: 2000 })) {
        await btn.click();
        await sleep(500);
      }
    } catch {
      // No consent dialog
    }

    const cookies = await this.context.cookies();
    const securityCookies = cookies.filter(
      (c) => c.name.startsWith("_px") || c.name.includes("pxvid") || c.name.includes("visid")
    );
    log(
      "success",
      `[iaai] Session established — ${cookies.length} cookies (${securityCookies.length} security)`
    );
  }

  /**
   * Detect whether the current page is a PX/Access-Denied challenge.
   * Used by callers to bail out gracefully rather than throw.
   */
  async isBlocked(): Promise<boolean> {
    if (!this.page) return true;
    try {
      const url = this.page.url();
      if (url.includes("/captcha") || url.includes("/_Incapsula_") || url.includes("px-captcha")) {
        return true;
      }
      const title = await this.page.title().catch(() => "");
      if (/access denied/i.test(title) || /are you a human/i.test(title)) return true;
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Navigate to a URL in the warmed browser context (PX cookies attached)
   * and return the rendered HTML. Detects the "Access Denied" PX page.
   */
  async fetchHtml(url: string): Promise<string> {
    if (!this.page) throw new Error("Session not initialized");

    const response = await this.page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });

    if (!response) throw new Error("No response");

    const status = response.status();
    if (status === 403 || status === 429) {
      log("warn", `[iaai] Navigation got ${status} — assuming PX challenge`);
      await this.refresh();
      throw new Error(`PX challenge (${status}) — session refreshed, retry`);
    }

    // Give Knockout.js / client-side scripts a beat to settle, then check.
    try {
      await this.page.waitForLoadState("networkidle", { timeout: 8000 });
    } catch {
      // ok — many IAAI pages never truly idle due to SignalR
    }

    const title = await this.page.title().catch(() => "");
    if (/access denied/i.test(title) || /are you a human/i.test(title)) {
      log("warn", "[iaai] Access Denied page — refreshing session");
      await this.refresh();
      throw new Error("PX challenge — session refreshed, retry");
    }

    return this.page.content();
  }

  /**
   * Run a DOM/JSON-extraction function against the currently-loaded page.
   * Used after `fetchHtml()` for structured parsing without re-navigating.
   */
  async evaluateOnCurrentPage<T>(fn: () => T): Promise<T> {
    if (!this.page) throw new Error("Session not initialized");
    return this.page.evaluate(fn);
  }

  private async refresh(): Promise<void> {
    if (!this.page) return;
    try {
      await this.page.goto(SEARCH_URL, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
      await sleep(12000);
      log("success", "[iaai] Session refreshed");
    } catch (err) {
      log("error", `[iaai] Session refresh failed: ${err}`);
    }
  }

  async close(): Promise<void> {
    try {
      if (this.page) await this.page.close().catch(() => {});
      if (this.context) await this.context.close().catch(() => {});
      if (this.browser) await this.browser.close().catch(() => {});
    } catch {
      // Ignore close errors
    }
    this.page = null;
    this.context = null;
    this.browser = null;
  }
}

// ─── IAAI Adapter ───────────────────────────────────────────────────────────

export class IaaiAdapter implements SourceAdapter {
  readonly name = "iaai";
  readonly type = "playwright" as const;

  private session: IaaiSession | null = null;
  private config: AdapterConfig | null = null;
  private ready = false;

  async init(config: AdapterConfig): Promise<void> {
    this.config = config;
    this.session = new IaaiSession(config.headless);
    await this.session.init();
    this.ready = true;
  }

  isReady(): boolean {
    return this.ready;
  }

  /**
   * Whether Playwright can launch. Lightweight check used by the
   * orchestrator before `init()` to decide whether to include this source.
   */
  async isPlaywrightAvailable(): Promise<boolean> {
    try {
      const browser = await chromium.launch({ headless: true });
      await browser.close();
      return true;
    } catch (err) {
      log("warn", `[iaai] Playwright unavailable: ${err}`);
      return false;
    }
  }

  async search(filters: SearchFilters): Promise<NormalizedVehicle[]> {
    if (!this.session || !this.config) throw new Error("Adapter not initialized");

    if (await this.session.isBlocked()) {
      log("warn", "[iaai] Session is on a challenge page — returning empty result");
      return [];
    }

    const allRows: IaaiSearchRow[] = [];
    const seenIds = new Set<string>();
    let currentPage = 1;

    log("info", `[iaai] Searching: ${JSON.stringify(filters)}`);

    while (currentPage <= this.config.maxPages) {
      const url = this.buildSearchUrl(filters, currentPage);
      let rows: IaaiSearchRow[];

      try {
        rows = await withRetry(
          () => this.fetchSearchPage(url),
          this.config.maxRetries,
          2000,
          `[iaai] Search page ${currentPage}`
        );
      } catch (err) {
        log("warn", `[iaai] Search page ${currentPage} failed: ${err}`);
        break;
      }

      if (!rows.length) {
        if (currentPage === 1) log("warn", "[iaai] No results found");
        break;
      }

      // IAAI repeats the last page of results when paginating past the end;
      // detect via first-inventory-id collision with what we've already seen.
      const newRows = rows.filter((r) => !seenIds.has(r.inventoryId));
      if (!newRows.length) {
        log("info", "[iaai] Reached end of results (all ids already seen)");
        break;
      }
      for (const r of newRows) seenIds.add(r.inventoryId);
      allRows.push(...newRows);

      if (currentPage === 1) {
        log("info", `[iaai] Page 1: ${newRows.length} results (pagination continues)`);
      }

      currentPage++;
      if (currentPage <= this.config.maxPages) {
        await sleep(jitteredDelay(Math.max(this.config.delayBetweenRequests, 2500)));
      }
    }

    // Post-filter: ensure make matches exactly (IAAI sometimes returns
    // cross-make results on broad keyword queries).
    let filtered = allRows;
    if (filters.make) {
      const makeLower = filters.make.toLowerCase();
      filtered = allRows.filter((row) => {
        // Parse "2017 NISSAN MAXIMA 3.5 SR" -> ["2017", "NISSAN", ...]
        const parts = (row.titleText ?? "").split(/\s+/);
        if (parts.length < 2) return true;
        return parts[1]?.toLowerCase() === makeLower;
      });
    }

    log("success", `[iaai] Search complete: ${filtered.length} rows`);
    return filtered.map((row) => this.normalizeSearchRow(row));
  }

  async getDetails(sourceId: string): Promise<NormalizedVehicle | null> {
    if (!this.session || !this.config) throw new Error("Adapter not initialized");

    if (await this.session.isBlocked()) {
      log("warn", "[iaai] Session is on a challenge page — returning null");
      return null;
    }

    // sourceId accepts "45184893", "45184893~US", or the full detail URL.
    const inventoryId = this.coerceInventoryId(sourceId);
    if (!inventoryId) return null;

    let details: IaaiProductDetails | null;
    try {
      details = await withRetry(
        () => this.fetchDetailPage(inventoryId),
        this.config.maxRetries,
        1500,
        `[iaai] Lot ${inventoryId} details`
      );
    } catch (err) {
      log("warn", `[iaai] getDetails failed for ${inventoryId}: ${err}`);
      return null;
    }

    if (!details) return null;
    const attrs = details.inventoryView?.attributes;
    if (!attrs || (!attrs.StockNumber && !attrs.VIN)) return null;

    return this.normalizeDetailAttrs(attrs, details);
  }

  /**
   * Return the top N "hottest" IAAI lots — sorted by auction date ascending
   * (soonest first) as a proxy for urgency. IAAI doesn't expose a public
   * watch-count, so we fall back to "ending soonest" which the `/Search`
   * endpoint supports via the default sort.
   *
   * IAAI's sort keys are ordinal (`DisplayOrder`) — the relevant ones are:
   *   "LiveDateTimeSortAsc"  — soonest auction first (their default)
   *   "CreatedDateTimeSortDesc" — newest first
   *
   * Since we can't filter "only with bids" from unauthenticated search, the
   * "hottest" proxy is simply "auction is about to close".
   */
  async fetchHottest(limit: number): Promise<NormalizedVehicle[]> {
    if (!this.session || !this.config) throw new Error("Adapter not initialized");

    if (await this.session.isBlocked()) {
      log("warn", "[iaai] Session is on a challenge page — returning empty hottest");
      return [];
    }

    const safeLimit = Math.max(1, Math.min(limit, 200));
    log("info", `[iaai] Fetching top ${safeLimit} hottest lots (soonest-auction sort)`);

    const collected: IaaiSearchRow[] = [];
    const seenIds = new Set<string>();
    let currentPage = 1;

    while (collected.length < safeLimit && currentPage <= this.config.maxPages) {
      const url = this.buildSearchUrl(
        {},
        currentPage,
        "LiveDateTimeSortAsc" // soonest-auction first
      );

      let rows: IaaiSearchRow[];
      try {
        rows = await withRetry(
          () => this.fetchSearchPage(url),
          this.config.maxRetries,
          2000,
          `[iaai] Hottest page ${currentPage}`
        );
      } catch (err) {
        log("warn", `[iaai] Hottest page ${currentPage} failed: ${err}`);
        break;
      }

      if (!rows.length) break;

      const newRows = rows.filter((r) => !seenIds.has(r.inventoryId));
      if (!newRows.length) break;
      for (const r of newRows) seenIds.add(r.inventoryId);
      collected.push(...newRows);

      currentPage++;
      if (collected.length < safeLimit && currentPage <= this.config.maxPages) {
        await sleep(jitteredDelay(Math.max(this.config.delayBetweenRequests, 2500)));
      }
    }

    const top = collected.slice(0, safeLimit).map((row) => {
      const normalized = this.normalizeSearchRow(row);
      // Urgency score: soonest-auction gets highest; 7-day window.
      if (normalized.auctionDate) {
        const hoursUntil =
          (new Date(normalized.auctionDate).getTime() - Date.now()) / 3_600_000;
        if (Number.isFinite(hoursUntil)) {
          normalized.hotnessScore = Math.max(0, 168 - hoursUntil); // 168h = 7d
        }
      }
      return normalized;
    });

    log("success", `[iaai] Hottest complete: ${top.length} lots`);
    return top;
  }

  async close(): Promise<void> {
    this.ready = false;
    if (this.session) {
      await this.session.close();
      this.session = null;
    }
  }

  // ── IAAI-specific internals ──

  /**
   * Build the IAAI search URL. IAAI's SPA accepts a flat query string with
   * PascalCase filter names plus the generic `queryFilterGroup=X` /
   * `queryFilterValue=Y` scheme for tag-based filters.
   *
   * Examples observed:
   *   /Search?Make=Toyota
   *   /Search?Make=Toyota&Model=Camry&YearFrom=2015&YearTo=2022
   *   /Search?queryFilterGroup=AuctionType&queryFilterValue=Buy%20Now
   *   /Search?Sort=LiveDateTimeSortAsc&page=2
   */
  private buildSearchUrl(
    filters: SearchFilters,
    page: number,
    sort?: string
  ): string {
    const params = new URLSearchParams();

    if (filters.make) params.set("Make", filters.make);
    if (filters.model) params.set("Model", filters.model);
    if (filters.yearFrom) params.set("YearFrom", String(filters.yearFrom));
    if (filters.yearTo) params.set("YearTo", String(filters.yearTo));
    if (filters.odometerMax) params.set("OdometerMax", String(filters.odometerMax));
    if (filters.titleType) params.set("TitleType", filters.titleType);
    if (filters.damageType) params.set("PrimaryDamage", filters.damageType);
    if (filters.bodyStyle) params.set("BodyStyle", filters.bodyStyle);
    if (filters.fuelType) params.set("FuelType", filters.fuelType);
    if (filters.driveType) params.set("DriveLineType", filters.driveType);
    if (filters.transmission) params.set("Transmission", filters.transmission);
    if (filters.color) params.set("ExteriorColor", filters.color);
    if (filters.location) params.set("BranchState", filters.location);
    if (filters.buyNowOnly) {
      params.set("queryFilterGroup", "AuctionType");
      params.set("queryFilterValue", "Buy Now");
    }

    if (sort) params.set("Sort", sort);
    if (page > 1) params.set("page", String(page));

    const qs = params.toString();
    return qs ? `${SEARCH_URL}?${qs}` : SEARCH_URL;
  }

  /**
   * Load a search URL and parse the result cards. Each card corresponds to
   * a `<div class="table-row table-row-border">` containing a
   * `watchinventoryid="{salvageId}~{tenant}"` attribute and a set of
   * `<li class="data-list__item">` entries with title-attribute metadata.
   */
  private async fetchSearchPage(url: string): Promise<IaaiSearchRow[]> {
    if (!this.session) throw new Error("Session not initialized");

    await this.session.fetchHtml(url);

    const rows = await this.session.evaluateOnCurrentPage((): IaaiSearchRow[] => {
      const out: IaaiSearchRow[] = [];
      const cards = document.querySelectorAll("div.table-row.table-row-border");
      cards.forEach((card) => {
        const watchEl = card.querySelector("[watchinventoryid]");
        const inventoryId = watchEl?.getAttribute("watchinventoryid") || "";
        if (!inventoryId) return;

        const detailLink = card.querySelector<HTMLAnchorElement>(
          "a[href*='VehicleDetail']"
        );
        const detailUrl = detailLink?.getAttribute("href") || "";

        const titleEl = card.querySelector("h4 a");
        const titleText = titleEl?.textContent?.trim() || "";

        const imgEl = card.querySelector<HTMLImageElement>(
          "img.lazyload, img[data-src*='vis.iaai.com']"
        );
        const thumbnailUrl =
          imgEl?.getAttribute("data-src") ||
          imgEl?.getAttribute("src") ||
          undefined;

        // Flatten every <li class="data-list__item"> into a key-value bag.
        const fields: Record<string, string> = {};
        card.querySelectorAll("li.data-list__item").forEach((li) => {
          // The `<span title="Label: Value">` is the most reliable source.
          li.querySelectorAll<HTMLSpanElement>("span[title]").forEach((sp) => {
            const raw = sp.getAttribute("title") || "";
            const m = raw.match(/^([^:]+):\s*(.*)$/);
            if (m) {
              const key = m[1].trim();
              const value = m[2].trim();
              if (key && value && !fields[key]) fields[key] = value;
            }
          });

          // Fall back to label + value spans.
          const labelEl = li.querySelector(".data-list__label");
          const valueEl = li.querySelector(".data-list__value");
          const label = labelEl?.textContent?.replace(/:$/, "").trim();
          const value = valueEl?.textContent?.trim();
          if (label && value && !fields[label]) fields[label] = value;

          // Run-and-drive badge appears as its own element.
          const badge = li.querySelector(".badge");
          if (badge) {
            const bt = badge.textContent?.trim();
            if (bt && !fields["StartCode"]) fields["StartCode"] = bt;
          }
        });

        // Pricing lives outside the data-list in IAAI search cards — in a
        // dedicated bidding block. Capture whatever dollar amounts appear
        // under known bidding/buy-now selectors so they can be parsed later.
        const pickText = (sel: string): string | undefined => {
          const el = card.querySelector<HTMLElement>(sel);
          const t = el?.textContent?.trim();
          return t && t.length ? t : undefined;
        };

        const bidText =
          pickText(".current-bid-amount") ??
          pickText(".current-bid") ??
          pickText(".bid-status-price") ??
          pickText(".starting-bid-amount") ??
          pickText(".starting-bid") ??
          pickText("[data-current-bid]") ??
          pickText(".bid-value");
        if (bidText && !fields["Current Bid"]) fields["Current Bid"] = bidText;

        const buyNowText =
          pickText(".buy-now-amount") ??
          pickText(".buy-now-price") ??
          pickText(".btn-buy-now") ??
          pickText("[data-buy-now]");
        if (buyNowText && !fields["Buy Now Price"]) fields["Buy Now Price"] = buyNowText;

        out.push({
          inventoryId,
          stockNumber: fields["Stock #"] || fields["Stock"],
          titleText,
          detailUrl,
          thumbnailUrl,
          fields,
        });
      });
      return out;
    });

    return rows;
  }

  /**
   * Load a lot detail page and extract the embedded ProductDetailsVM JSON.
   */
  private async fetchDetailPage(
    inventoryId: string
  ): Promise<IaaiProductDetails | null> {
    if (!this.session) throw new Error("Session not initialized");

    await this.session.fetchHtml(LOT_DETAILS_URL(inventoryId));

    const json = await this.session.evaluateOnCurrentPage(
      (): string | null => {
        const el = document.getElementById("ProductDetailsVM");
        return el?.textContent ?? null;
      }
    );

    if (!json) return null;

    try {
      return JSON.parse(json) as IaaiProductDetails;
    } catch (err) {
      log("warn", `[iaai] Failed to parse ProductDetailsVM JSON: ${err}`);
      return null;
    }
  }

  /** Accept "45184893", "45184893~US", "/VehicleDetail/45184893~US". */
  private coerceInventoryId(raw: string): string | null {
    const s = String(raw).trim();
    if (!s) return null;
    const m = s.match(/(\d+~[A-Z]{2})|(\d{6,})$/);
    if (!m) return null;
    const id = m[1] ?? m[2];
    return id.includes("~") ? id : `${id}~US`;
  }

  /**
   * Normalize a search-card row into a NormalizedVehicle. Search cards
   * expose enough for ranking (year/make/model/damage/odometer/date) but
   * VIN is masked and several condition fields may be hidden — call
   * `getDetails()` if the full picture is needed.
   */
  private normalizeSearchRow(row: IaaiSearchRow): NormalizedVehicle {
    const fields = row.fields;
    const parts = (row.titleText ?? "").split(/\s+/);
    const year = this.parseInt(parts[0]) ?? 0;
    const make = parts[1] ?? "";
    const model = parts[2] ?? "";
    const trimParts = parts.slice(3);
    const trim = trimParts.length ? trimParts.join(" ") : undefined;

    const salvageId = row.inventoryId.split("~")[0] ?? row.inventoryId;
    const sourceUrl = row.detailUrl.startsWith("http")
      ? row.detailUrl
      : `${IAAI_BASE}${row.detailUrl || `/VehicleDetail/${row.inventoryId}`}`;

    return {
      source: "iaai",
      sourceId: row.inventoryId || salvageId,
      sourceUrl,
      lotNumber: row.stockNumber,
      vin: (fields["VIN"] ?? "").trim(),
      make,
      model,
      year,
      trim,
      bodyStyle: fields["Body Style"] || undefined,
      exteriorColor: fields["Exterior Color"] || undefined,
      interiorColor: fields["Interior Color"] || undefined,
      engineType: fields["Engine"] || undefined,
      cylinders: fields["Cylinder"] || undefined,
      transmission: fields["Transmission"] || undefined,
      driveType: fields["Driveline Type"] || undefined,
      fuelType: fields["Fuel Type"] || undefined,
      odometer: this.parseOdometer(fields["Odometer"]),
      odometerBrand: this.extractOdometerBrand(fields["Odometer"]),
      titleType: this.mapTitleType(fields["Title/Sale Doc"]),
      primaryDamage: fields["Primary Damage"] || undefined,
      secondaryDamage: fields["Secondary Damage"] || undefined,
      lossType: fields["Loss"] || undefined,
      startCode: fields["StartCode"] || undefined,
      hasKeys: this.parseHasKeys(fields["Key"]),
      actualCashValue: this.parseMoney(fields["ACV"]),
      currentBid: this.parseMoney(fields["Current Bid"]) ?? 0,
      buyNowPrice: this.parseMoney(fields["Buy Now Price"]) ?? null,
      auctionLocation: fields["Branch"] || undefined,
      seller: fields["Seller"] && !fields["Seller"].includes("*")
        ? fields["Seller"]
        : undefined,
      images: [],
      thumbnailUrl: row.thumbnailUrl,
      scrapedAt: new Date().toISOString(),
    };
  }

  /**
   * Normalize a full-detail attributes blob + auction info into a
   * NormalizedVehicle. This is the canonical, complete normalization.
   */
  private normalizeDetailAttrs(
    attrs: IaaiAttributes,
    details: IaaiProductDetails
  ): NormalizedVehicle {
    const salvageId = attrs.SalvageId ?? "";
    const tenant = attrs.Tenant ?? "US";
    const id = attrs.Id ?? (salvageId ? `${salvageId}~${tenant}` : "");
    const sourceUrl = id ? `${IAAI_BASE}/VehicleDetail/${id}` : IAAI_BASE;

    // Build image URLs from the image keys array — each key is like
    // "45184893~SID~B427~S0~I1~RW2576~H1932~TH0". The public resizer URL
    // accepts these directly.
    const imageKeys = details.inventoryView?.imageDimensions?.keys?.$values ?? [];
    const images = imageKeys
      .map((k) => k?.k)
      .filter((k): k is string => typeof k === "string" && k.length > 0)
      .map((k) => `https://vis.iaai.com/resizer?imageKeys=${k}&width=845&height=633`);

    const thumbnail = salvageId
      ? `https://vis.iaai.com/resizer?imageKeys=${salvageId}~SID~I1&width=400&height=300`
      : images[0];

    const bidding = details.auctionInformation?.biddingInformation;
    const prebid = details.auctionInformation?.prebidInformation;
    const currentBid =
      this.parseMoney(prebid?.highBidAmount) ??
      this.parseInt(prebid?.decimalHighBidAmount) ??
      0;
    const buyNowPrice = bidding?.buyNowInd
      ? (bidding.buyNowAmount ?? null) || null
      : null;

    return {
      source: "iaai",
      sourceId: id || salvageId,
      sourceUrl,
      lotNumber: attrs.StockNumber || undefined,
      vin: (attrs.VIN ?? "").trim(),
      make: (attrs.Make ?? "").trim(),
      model: (attrs.Model ?? "").trim(),
      year: this.parseInt(attrs.Year) ?? 0,
      trim: attrs.Series?.trim() || undefined,
      bodyStyle: attrs.BodyStyleName || attrs.Segment || undefined,
      exteriorColor: attrs.ExteriorColor?.trim() || undefined,
      interiorColor: this.clean(attrs.InteriorColor),
      engineType: attrs.EngineInformation?.trim() || attrs.EngineSize?.trim() || undefined,
      cylinders: attrs.CylindersDesc || attrs.Cylinders || undefined,
      transmission: attrs.Transmission || undefined,
      driveType: attrs.DriveLineTypeDesc || undefined,
      fuelType: attrs.FuelTypeDesc || undefined,
      odometer: this.parseInt(attrs.ODOValue) ?? 0,
      odometerBrand: attrs.ODOBrand || undefined,
      titleType: this.mapTitleType(attrs.TitleCode || attrs.TitleBrand || attrs.Title),
      titleState: attrs.TitleStateName || attrs.TitleState || undefined,
      primaryDamage: attrs.PrimaryDamageDesc || undefined,
      secondaryDamage: this.clean(attrs.SecondaryDamageDesc),
      lossType: attrs.LossTypeDesc || undefined,
      startCode: attrs.StartsDesc || undefined,
      hasKeys: this.parseBool(attrs.Keys),
      currentBid,
      buyNowPrice,
      auctionDate: this.parseIaaiDate(attrs.AuctionDateTime),
      auctionLocation: attrs.BranchName || undefined,
      seller: attrs.Origin || undefined,
      images,
      thumbnailUrl: thumbnail,
      scrapedAt: new Date().toISOString(),
    };
  }

  // ── Parsing helpers ──

  private parseInt(value: string | number | null | undefined): number | undefined {
    if (value == null || value === "") return undefined;
    const n = typeof value === "number" ? value : parseInt(value, 10);
    return Number.isFinite(n) ? n : undefined;
  }

  private parseMoney(value: string | null | undefined): number | undefined {
    if (!value) return undefined;
    const digits = value.replace(/[^0-9.]/g, "");
    if (!digits) return undefined;
    const n = parseFloat(digits);
    return Number.isFinite(n) ? n : undefined;
  }

  /** Parse "257,244 mi" -> 257244. */
  private parseOdometer(value: string | undefined): number {
    if (!value) return 0;
    const digits = value.replace(/[^0-9]/g, "");
    return digits ? parseInt(digits, 10) : 0;
  }

  /** Parse "257,244 mi (Actual)" -> "Actual". */
  private extractOdometerBrand(value: string | undefined): string | undefined {
    if (!value) return undefined;
    const m = value.match(/\(([^)]+)\)/);
    return m ? m[1].toUpperCase() : undefined;
  }

  private parseBool(value: string | undefined): boolean | undefined {
    if (value == null) return undefined;
    const t = value.trim().toLowerCase();
    if (t === "true" || t === "yes") return true;
    if (t === "false" || t === "no") return false;
    return undefined;
  }

  private parseHasKeys(value: string | undefined): boolean | undefined {
    if (!value) return undefined;
    if (/yes|present|available/i.test(value)) return true;
    if (/no|absent|missing/i.test(value)) return false;
    return undefined;
  }

  /** Parse "4/10/2026 2:30:00 PM +00:00" into ISO-8601. */
  private parseIaaiDate(value: string | undefined): string | undefined {
    if (!value) return undefined;
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed)) return value;
    return new Date(parsed).toISOString();
  }

  /** Return undefined for whitespace-only strings (IAAI uses " " as null). */
  private clean(value: string | undefined): string | undefined {
    if (!value) return undefined;
    const t = value.trim();
    return t.length ? t : undefined;
  }

  private mapTitleType(iaaiTitle?: string): string | undefined {
    if (!iaaiTitle) return undefined;
    const t = iaaiTitle.toUpperCase().trim();
    if (!t || t === " ") return undefined;
    if (t.includes("CLEAN") || t === "CLR" || t === "CLEAR") return "Clean";
    if (t.includes("SALVAGE") || t === "SAL") return "Salvage";
    if (t.includes("REBUILT") || t.includes("REBUILDABLE") || t === "REB") return "Rebuilt";
    if (t.includes("JUNK")) return "Junk";
    if (t.includes("CERTIFICATE") || t.includes("CERT OF TITLE")) return "Clean";
    return iaaiTitle;
  }
}

// Note: `MAX_CONCURRENT_TABS` is exported-by-name only via this comment so the
// orchestrator (or future bulk-enrichment code) has a documented cap. The
// current adapter uses a single page + full-page navigation, which keeps tab
// pressure naturally at 1. If bulk per-lot detail enrichment is added later,
// gate it on this constant.
void MAX_CONCURRENT_TABS;

// Singleton instance shared across the orchestrator.
export const iaaiAdapter = new IaaiAdapter();
