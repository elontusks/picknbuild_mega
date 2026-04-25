import { chromium, Browser, BrowserContext, Page } from "playwright";
import { SourceAdapter } from "../core/adapter.js";
import { NormalizedVehicle, SearchFilters, AdapterConfig } from "../core/types.js";
import { log, sleep, jitteredDelay, withRetry } from "../core/utils.js";

// ─── Copart internal API URLs ───────────────────────────────────────────────

const SEARCH_URL = "https://www.copart.com/public/lots/search-results";
const LOT_DETAILS_URL = "https://www.copart.com/public/data/lotdetails/solr";
const LOT_IMAGES_URL = "https://www.copart.com/public/data/lotdetails/solr/lotImages";
const DYNAMIC_LOT_URL = "https://www.copart.com/public/lots/dynamicLotDetails";

// ─── Copart API response field abbreviations ────────────────────────────────

interface CopartLot {
  ln: number;    // lot number
  mkn: string;   // make name
  lmg: string;   // model group
  lm: string;    // model + trim
  mmod: string;  // model name
  lcy: number;   // year
  orr: number;   // odometer reading
  ord?: string;  // odometer reading display / brand (e.g. "EXEMPT", "ACTUAL") — verified against prod
  tims: string;  // thumbnail image URL
  rc: number;    // repair cost estimate
  lotPlugAcv?: number; // ACV (actual cash value pre-loss) — verified against prod
  yn: string;    // yard name (e.g. "FL - MIAMI SOUTH")
  syn: string;   // sale yard name
  ad: number;    // auction date (timestamp)
  // Note: auction timezone is exposed by Copart on dynamicLotDetails.timeZone,
  // not on the static lot object. Read it from the dynamic endpoint in getDetails().
  hb: number;    // high bid
  ts: string;    // title state code
  tgd: string;   // title group description
  bnp: number;   // buy now price
  clr: string;   // color
  dd: string;    // primary damage description
  sdd: string;   // secondary damage description
  lcd?: string;  // unverified — presumed loss category (COLLISION / FLOOD / etc.)
  drv: string;   // drive type
  cy: string;    // cylinders
  egn: string;   // engine info
  tmtp: string;  // transmission type
  ft: string;    // fuel type
  fv: string;    // VIN
  bstl: string;  // body style
  hk: string;    // has keys ("YES" / "NO")
  sn?: string;   // seller name — verified against prod
  stp?: string;  // unverified — presumed seller type
  wc?: number;   // unverified — presumed watch count
  bc?: number;   // unverified — presumed bid count
}

// ─── Browser Session ────────────────────────────────────────────────────────

class CopartSession {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private headless: boolean;

  constructor(headless: boolean) {
    this.headless = headless;
  }

  async init(): Promise<void> {
    log("info", "[copart] Launching browser...");

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

    // Remove webdriver detection flag
    await this.context.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });

    this.page = await this.context.newPage();

    // Block heavy resources
    await this.page.route(
      /\.(png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)$/,
      (route) => route.abort()
    );
    await this.page.route(
      /(google-analytics|gtm\.js|facebook\.com|doubleclick\.net|hotjar|segment)/,
      (route) => route.abort()
    );

    // Navigate to Copart and wait for anti-bot challenge
    log("info", "[copart] Navigating to Copart...");
    try {
      await this.page.goto("https://www.copart.com/vehicleFinder", {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
    } catch {
      log("warn", "[copart] Vehicle finder timed out, trying homepage...");
      await this.page.goto("https://www.copart.com/", {
        waitUntil: "commit",
        timeout: 45000,
      });
    }

    // Wait for Incapsula anti-bot JS to resolve
    log("info", "[copart] Waiting for anti-bot challenge...");
    await sleep(12000);

    // Dismiss cookie consent if present
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
      (c) => c.name.includes("incap") || c.name.includes("visid")
    );
    log(
      "success",
      `[copart] Session established — ${cookies.length} cookies (${securityCookies.length} security)`
    );
  }

  /**
   * Execute a fetch from within the browser context so all anti-bot
   * cookies are automatically included.
   */
  async browserFetch(
    url: string,
    options: { method?: string; body?: string; headers?: Record<string, string> } = {}
  ): Promise<any> {
    if (!this.page) throw new Error("Session not initialized");

    const result = await this.page.evaluate(
      async ({ url, options }) => {
        try {
          const response = await fetch(url, {
            method: options.method ?? "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json, text/plain, */*",
              ...options.headers,
            },
            body: options.body,
            credentials: "same-origin",
          });

          const contentType = response.headers.get("content-type") ?? "";

          if (contentType.includes("text/html")) {
            return { error: true, isAntiBot: true, status: response.status };
          }

          if (!response.ok) {
            const text = await response.text().catch(() => "");
            return { error: true, status: response.status, body: text.slice(0, 300) };
          }

          return { error: false, data: await response.json() };
        } catch (err: any) {
          return { error: true, message: err.message };
        }
      },
      { url, options }
    );

    if (result.isAntiBot) {
      log("warn", "[copart] Anti-bot challenge — refreshing session...");
      await this.refresh();
      throw new Error("Anti-bot challenge — session refreshed, retry");
    }

    if (result.error) {
      throw new Error(`Fetch failed: ${result.status ?? result.message ?? "unknown"}`);
    }

    return result.data;
  }

  private async refresh(): Promise<void> {
    if (!this.page) return;
    try {
      await this.page.goto("https://www.copart.com/vehicleFinder", {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
      await sleep(10000);
      log("success", "[copart] Session refreshed");
    } catch (err) {
      log("error", `[copart] Session refresh failed: ${err}`);
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

// ─── Copart Adapter ─────────────────────────────────────────────────────────

export class CopartAdapter implements SourceAdapter {
  readonly name = "copart";
  readonly type = "playwright" as const;

  private session: CopartSession | null = null;
  private config: AdapterConfig | null = null;
  private ready = false;

  async init(config: AdapterConfig): Promise<void> {
    this.config = config;
    this.session = new CopartSession(config.headless);
    await this.session.init();
    this.ready = true;
  }

  isReady(): boolean {
    return this.ready;
  }

  async search(filters: SearchFilters): Promise<NormalizedVehicle[]> {
    if (!this.session || !this.config) throw new Error("Adapter not initialized");

    const allLots: CopartLot[] = [];
    let currentPage = 0;
    let totalPages = 1;

    log("info", `[copart] Searching: ${JSON.stringify(filters)}`);

    while (currentPage < totalPages && currentPage < this.config.maxPages) {
      const body = this.buildSearchBody(filters, currentPage, this.config.pageSize);

      const result = await withRetry(
        () => this.session!.browserFetch(SEARCH_URL, { method: "POST", body: JSON.stringify(body) }),
        this.config.maxRetries,
        2000,
        `[copart] Search page ${currentPage + 1}`
      );

      const content = result?.data?.results?.content;
      if (!content || content.length === 0) {
        if (currentPage === 0) log("warn", "[copart] No results found");
        break;
      }

      if (currentPage === 0) {
        const totalElements = result.data.results.totalElements ?? 0;
        totalPages = Math.ceil(totalElements / this.config.pageSize);
        log("info", `[copart] Found ${totalElements} vehicles across ${totalPages} pages`);
      }

      allLots.push(...content);
      currentPage++;

      if (currentPage < totalPages && currentPage < this.config.maxPages) {
        await sleep(jitteredDelay(this.config.delayBetweenRequests));
      }
    }

    // Post-filter: ensure make matches exactly
    let filtered = allLots;
    if (filters.make) {
      const makeLower = filters.make.toLowerCase();
      filtered = allLots.filter((lot) => lot.mkn?.toLowerCase() === makeLower);
    }

    log("success", `[copart] Search complete: ${filtered.length} lots`);
    return filtered.map((lot) => this.normalize(lot));
  }

  /**
   * Fetch the hottest lots, using Copart's own salelight_priority sort —
   * this is the same order their homepage surfaces as "featured" / ending soon,
   * which is the industry-standard "hotness" proxy. watch_count is NOT a valid
   * Copart Solr sort key (returns an HTML error page).
   */
  async fetchHottest(limit: number): Promise<NormalizedVehicle[]> {
    if (!this.session || !this.config) throw new Error("Adapter not initialized");

    log("info", `[copart] Fetching ${limit} hottest lots...`);

    const body = {
      query: ["*"],
      filter: {},
      sort: [
        "salelight_priority asc",
        "auction_date_type desc",
        "auction_date_utc asc",
      ],
      page: 0,
      size: limit,
      start: 0,
      watchListOnly: false,
      freeFormSearch: false,
      hideImages: false,
      defaultSort: false,
      specificRowProvided: false,
      displayName: "",
      searchName: "",
      backUrl: "",
      includeTagByField: {},
      rawParams: {},
    };

    const result = await withRetry(
      () => this.session!.browserFetch(SEARCH_URL, { method: "POST", body: JSON.stringify(body) }),
      this.config.maxRetries,
      2000,
      `[copart] Hottest fetch`
    );

    const content: any[] = result?.data?.results?.content ?? [];
    if (content.length === 0) {
      log("warn", "[copart] No hottest lots returned");
      return [];
    }

    log("success", `[copart] Hottest fetch returned ${content.length} lots`);

    return content.slice(0, limit).map((lot: CopartLot) => {
      const normalized = this.normalize(lot);
      // Hotness: prefer watch count (industry-standard demand signal); fall back
      // to inverse seconds-to-auction (closer auctions are "hotter").
      if (typeof normalized.watchCount === "number") {
        normalized.hotnessScore = normalized.watchCount;
      } else if (lot.ad) {
        const secondsToAuction = Math.max(1, (lot.ad - Date.now()) / 1000);
        normalized.hotnessScore = 1 / secondsToAuction;
      }
      return normalized;
    });
  }

  async getDetails(sourceId: string): Promise<NormalizedVehicle | null> {
    if (!this.session || !this.config) throw new Error("Adapter not initialized");

    const lotNumber = parseInt(sourceId, 10);
    if (isNaN(lotNumber)) return null;

    const [details, images, dynamic] = await Promise.all([
      withRetry(
        () => this.session!.browserFetch(`${LOT_DETAILS_URL}/${lotNumber}`),
        this.config.maxRetries, 1500, `[copart] Lot ${lotNumber} details`
      ).catch(() => null),
      withRetry(
        () => this.session!.browserFetch(`${LOT_IMAGES_URL}/${lotNumber}/USA`),
        this.config.maxRetries, 1500, `[copart] Lot ${lotNumber} images`
      ).catch(() => null),
      withRetry(
        () => this.session!.browserFetch(`${DYNAMIC_LOT_URL}/${lotNumber}/false`),
        this.config.maxRetries, 1500, `[copart] Lot ${lotNumber} dynamic`
      ).catch(() => null),
    ]);

    const d = details?.data?.lotDetails;
    if (!d) return null;

    // Collect images: prefer HD > full > thumb
    const imgData = images?.data?.imagesList;
    const imgUrls: string[] =
      imgData?.hd?.map((i: any) => i.url) ??
      imgData?.full?.map((i: any) => i.url) ??
      imgData?.thumb?.map((i: any) => i.url) ??
      [];

    const vehicle: NormalizedVehicle = {
      source: "copart",
      sourceId: String(lotNumber),
      sourceUrl: `https://www.copart.com/lot/${lotNumber}`,
      lotNumber: String(lotNumber),
      vin: d.fv ?? "",
      make: d.mkn ?? "",
      model: d.lmg ?? d.mmod ?? "",
      year: d.lcy ?? 0,
      trim: d.lm ?? undefined,
      bodyStyle: d.bstl ?? undefined,
      exteriorColor: d.clr ?? undefined,
      engineType: d.egn ?? undefined,
      cylinders: d.cy ?? undefined,
      transmission: d.tmtp ?? undefined,
      driveType: d.drv ?? undefined,
      fuelType: d.ft ?? undefined,
      odometer: d.orr ?? 0,
      odometerBrand: d.ord ?? undefined,
      titleType: this.mapTitleType(d.tgd),
      titleState: d.ts ?? undefined,
      primaryDamage: d.dd ?? undefined,
      secondaryDamage: d.sdd ?? undefined,
      lossType: d.lcd ?? undefined,
      currentBid: dynamic?.data?.currentBid ?? d.hb ?? 0,
      buyNowPrice: dynamic?.data?.buyNowPrice ?? (d.bnp || null),
      actualCashValue: d.lotPlugAcv ?? undefined,
      estimatedRepairCost: d.rc ?? undefined,
      auctionDate: dynamic?.data?.auctionDate ?? (d.ad ? new Date(d.ad).toISOString() : undefined),
      // Copart exposes timezone on the dynamicLotDetails payload (verified against prod)
      auctionTimezone: dynamic?.data?.timeZone ?? undefined,
      auctionLocation: d.yn ?? undefined,
      seller: d.sn ?? undefined,
      sellerType: d.stp ?? undefined,
      watchCount: typeof d.wc === "number" ? d.wc : undefined,
      bidCount: typeof d.bc === "number" ? d.bc : undefined,
      hasKeys: d.hk === "YES" ? true : d.hk === "NO" ? false : undefined,
      images: imgUrls,
      thumbnailUrl: d.tims ?? undefined,
      scrapedAt: new Date().toISOString(),
    };

    return vehicle;
  }

  async close(): Promise<void> {
    this.ready = false;
    if (this.session) {
      await this.session.close();
      this.session = null;
    }
  }

  // ── Copart-specific internals ──

  /**
   * Build the Copart search API request body.
   * Uses Lucene-style filter syntax for structured fields.
   */
  private buildSearchBody(
    filters: SearchFilters,
    page: number,
    size: number
  ): Record<string, any> {
    const queryParts: string[] = [];
    if (filters.make) queryParts.push(filters.make);
    if (filters.model) queryParts.push(filters.model);

    const queryString = queryParts.length > 0 ? queryParts.join(" ") : "*";
    const isFreeForm = queryParts.length > 0;

    const filterMap: Record<string, string[]> = {};

    if (filters.yearFrom || filters.yearTo) {
      const from = filters.yearFrom ?? 1900;
      const to = filters.yearTo ?? 2030;
      filterMap["YEAR"] = [`lot_year:[${from} TO ${to}]`];
    }
    if (filters.damageType) filterMap["PRIM_DMG"] = [`damage_description:${filters.damageType}`];
    if (filters.titleType) filterMap["TITLE_TYPE"] = [`sale_title_type:${filters.titleType}`];
    if (filters.odometerMax) filterMap["ODOM"] = [`lot_orr:[0 TO ${filters.odometerMax}]`];
    if (filters.bodyStyle) filterMap["BODY_STYLE"] = [`body_style:${filters.bodyStyle}`];
    if (filters.fuelType) filterMap["FUEL_TP"] = [`fuel_type:${filters.fuelType}`];
    if (filters.driveType) filterMap["DRIVE"] = [`drive:${filters.driveType}`];
    if (filters.transmission) filterMap["TRSM"] = [`transmission:${filters.transmission}`];
    if (filters.color) filterMap["COLOR"] = [`color:${filters.color}`];
    if (filters.buyNowOnly) filterMap["BUY_NOW"] = ["buy_now:true"];

    return {
      query: [queryString],
      filter: filterMap,
      sort: ["salelight_priority asc", "auction_date_type desc", "auction_date_utc asc"],
      page,
      size,
      start: page * size,
      watchListOnly: false,
      freeFormSearch: isFreeForm,
      hideImages: false,
      defaultSort: false,
      specificRowProvided: false,
      displayName: "",
      searchName: "",
      backUrl: "",
      includeTagByField: {},
      rawParams: {},
    };
  }

  /**
   * Normalize a raw Copart lot into the shared NormalizedVehicle type.
   */
  private normalize(lot: CopartLot): NormalizedVehicle {
    return {
      source: "copart",
      sourceId: String(lot.ln),
      sourceUrl: `https://www.copart.com/lot/${lot.ln}`,
      lotNumber: String(lot.ln),
      vin: lot.fv ?? "",
      make: lot.mkn ?? "",
      model: lot.lm || lot.lmg || lot.mmod || "",
      year: lot.lcy ?? 0,
      trim: lot.lm || undefined,
      bodyStyle: lot.bstl || undefined,
      exteriorColor: lot.clr || undefined,
      engineType: lot.egn || undefined,
      cylinders: lot.cy || undefined,
      transmission: lot.tmtp || undefined,
      driveType: lot.drv || undefined,
      fuelType: lot.ft || undefined,
      odometer: lot.orr ?? 0,
      odometerBrand: lot.ord || undefined,
      titleType: this.mapTitleType(lot.tgd),
      titleState: lot.ts || undefined,
      primaryDamage: lot.dd || undefined,
      secondaryDamage: lot.sdd || undefined,
      lossType: lot.lcd || undefined,
      currentBid: lot.hb ?? 0,
      buyNowPrice: lot.bnp || null,
      actualCashValue: lot.lotPlugAcv || undefined,
      estimatedRepairCost: lot.rc || undefined,
      auctionDate: lot.ad ? new Date(lot.ad).toISOString() : undefined,
      // Timezone is not present on search-results lots; populated in getDetails() from dynamicLotDetails
      auctionLocation: lot.yn || undefined,
      seller: lot.sn || undefined,
      sellerType: lot.stp || undefined,
      watchCount: typeof lot.wc === "number" ? lot.wc : undefined,
      bidCount: typeof lot.bc === "number" ? lot.bc : undefined,
      hasKeys: lot.hk === "YES" ? true : lot.hk === "NO" ? false : undefined,
      images: [],
      thumbnailUrl: lot.tims || undefined,
      scrapedAt: new Date().toISOString(),
    };
  }

  private mapTitleType(copartTitle?: string): string | undefined {
    if (!copartTitle) return undefined;
    const t = copartTitle.toUpperCase();
    if (t.includes("CLEAN")) return "Clean";
    if (t.includes("SALVAGE")) return "Salvage";
    if (t.includes("REBUILT")) return "Rebuilt";
    if (t.includes("CERTIFICATE")) return "Clean";
    return copartTitle;
  }
}
