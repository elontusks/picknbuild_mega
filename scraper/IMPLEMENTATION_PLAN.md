# Implementation Plan

Step-by-step plan for building the agentic scrape orchestrator from the current scaffolding to a production-ready multi-source vehicle ingestion system.

---

## Phase 1: Foundation (make what exists actually run)

**Goal**: Get the orchestrator server running end-to-end with the Copart adapter, producing real results from real searches.

### 1.1 — Wire orchestrator to SQLite database
- Connect `scrape-orch` to the same `athin-scraper.db` (or a separate one)
- Read `scrape_sites` to know which adapters to enable
- Write search results back to `scrape_listings`
- Log every search to `scrape_runs`

### 1.2 — Execute Copart adapter end-to-end
- `npm install` + `npx playwright install` in `scrape-orch/`
- Run `npm run dev`, hit `POST /search` with `{ make: "Honda", model: "Civic", year: 2020 }`
- Verify: Playwright launches, session establishes, Copart API returns lots, results normalize correctly
- Fix any runtime issues (anti-bot timing, field mapping mismatches, etc.)

### 1.3 — Connect orchestrator to the web app
- Add a "Multi-Source Search" section to `dashboard.tsx` (separate from single-URL scraping)
- Web app calls orchestrator at `localhost:3099/search` with user preferences
- Display ranked results in the existing listings grid format
- Show source badges (Copart, IAAI, etc.) on each card

### 1.4 — FC spec reads from DB
- When orchestrator initializes, load each site's `fc_specification` from `scrape_sites`
- After a search, update the site's FC spec based on what fields came back empty
- Verify the spec evolves across multiple searches against the same site

**Done when**: You can sign up in the web app, enter search preferences, hit "Search", and see scored Copart results in the dashboard. FC spec in the DB updates after each search.

---

## Phase 2: Firecrawl adapter (the second adapter type)

**Goal**: Add a Firecrawl-based adapter that can scrape any HTML-rendered car site, proving the adapter pattern works with two fundamentally different approaches.

### 2.1 — Build the base Firecrawl adapter
- Create `src/adapters/firecrawl.ts` implementing `SourceAdapter`
- `init()`: validate Firecrawl API key
- `search()`: given a search URL pattern + filters, call Firecrawl with the extraction schema from `scraper.ts`
- `getDetails()`: scrape a single listing URL
- Wire the FC spec into the extraction prompt via `buildExtractionPrompt()`
- Register in `server.ts` alongside CopartAdapter

### 2.2 — Site-specific URL pattern config
- Each Firecrawl-backed site needs a URL template for search pages:
  - Cars.com: `https://www.cars.com/shopping/results/?stock_type=used&makes[]={make}&models[]={model}&...`
  - CarGurus: `https://www.cargurus.com/Cars/inventorylisting/viewDetailsFilterViewInventoryListing.action?...`
- Store these patterns in `scrape_sites` (new column `search_url_template`)
- The adapter interpolates user filters into the template

### 2.3 — Multi-page crawl for Firecrawl sites
- Search result pages have pagination — Firecrawl can crawl multiple pages
- Implement pagination: extract "next page" link or increment page param
- Respect `maxPages` from adapter config
- Collect and deduplicate across pages

### 2.4 — Test with Cars.com or CarGurus
- Pick one real site, scrape it, verify extraction quality
- Check which fields come back empty → FC spec should note these
- Re-scrape → FC spec appended → check if extraction improves

**Done when**: `POST /search { make: "Honda", model: "Civic" }` returns results from both Copart (Playwright) and Cars.com (Firecrawl), deduped by VIN, scored and merged.

---

## Phase 3: Agentic decision-making (replace rules with reasoning)

**Goal**: The agent dynamically decides how to scrape any site — including sites it's never seen — by reasoning about the site profile, FC spec history, and live page inspection.

### 3.1 — Strategy executor
- Currently `agent.ts` produces a `ScrapeStrategy` but nothing executes it
- Build a `StrategyExecutor` class that walks through the steps array:
  - For each step, call the appropriate adapter method
  - If a step fails and has a `fallbackTo`, switch to that step type
  - Respect `maxRetries` per step
  - After all steps, collect results and update FC spec

### 3.2 — Live site inspection step
- Before committing to a strategy, add a lightweight probe:
  - Firecrawl scrape the site's homepage or a sample listing page
  - Extract: does the page have structured data (JSON-LD, microdata)? Is there an API call in network traffic? Is there anti-bot (Cloudflare challenge page, captcha)?
- Feed these observations into the strategy decision

### 3.3 — LLM-based strategy builder
- Replace the rule-based `buildStrategy()` with a Claude API call
- Prompt structure:
  ```
  You are a web scraping strategist. Given what I know about a site,
  decide the best approach to extract vehicle listings.
  
  Site: {name} ({baseUrl})
  Type: {siteType}
  Has known API: {hasKnownApi}
  Has anti-bot: {hasAntiBot}
  FC Specification (history of past attempts):
  {fcSpecification}
  
  Recent run results:
  {recentRuns summary}
  
  Available step types: playwright_api, playwright_scrape, firecrawl_extract,
  firecrawl_crawl, enrich, retry_with_spec, wait_antibot, fallback
  
  Return a JSON ScrapeStrategy with ordered steps and fallbacks.
  ```
- The LLM can reason about novel sites: "This looks like a Shopify-based dealer site, Firecrawl should work. The FC spec says VIN was missing last time — add a retry step targeting VIN extraction."

### 3.4 — Strategy caching + learning
- Cache successful strategies per site (in `scrape_sites`, new column `cached_strategy`)
- On first scrape of a new site: LLM reasons from scratch
- On subsequent scrapes: use cached strategy, fall back to LLM if it starts failing
- Periodically re-evaluate cached strategies when failure rate rises

**Done when**: You can point the orchestrator at a car listing site it's never seen before, and it figures out how to scrape it — choosing the right approach, handling failures, and improving over time.

---

## Phase 4: IAAI adapter + auction specialization

**Goal**: Add the second Playwright adapter (IAAI), proving the Playwright adapter pattern generalizes beyond Copart.

### 4.1 — Reverse-engineer IAAI's internal API
- IAAI (iaai.com) has similar anti-bot (DataDome) and internal JSON APIs
- Map out: search endpoint, request body format, field names, pagination
- Document the differences from Copart

### 4.2 — Build IAAIAdapter
- Create `src/adapters/iaai.ts` implementing `SourceAdapter`
- Manage DataDome session (different from Incapsula)
- Map IAAI field names to `NormalizedVehicle`
- Register in server

### 4.3 — Cross-source deduplication
- Copart and IAAI often list the same vehicle
- Test VIN-based dedup: same car from both sources should merge into one result
- Verify image merging, price comparison display

**Done when**: A search returns results from Copart + IAAI + Cars.com, deduped, with VIN matches merged.

---

## Phase 5: Orchestrator ↔ web app integration

**Goal**: Seamless UX where users search once and see results from all sources, with the orchestrator running behind the scenes.

### 5.1 — Search UI in web app
- Build a search form: make, model, year, budget, mileage target, state, title preference
- Submit → calls orchestrator `/search`
- Results page: cards with source badge, match score bar, expandable details
- Filter/sort by source, price, score, distance

### 5.2 — Per-source status indicators
- Show which adapters are online/offline in the UI
- If Copart session dies mid-search, show partial results + "Copart unavailable" badge
- Health polling from dashboard

### 5.3 — Saved searches + alerts
- Let users save search preferences
- Periodic re-search (cron or manual) to find new listings
- Show "new since last search" badges

**Done when**: The web app is a usable vehicle discovery tool pulling from multiple sources.

---

## Phase 6: Production hardening

**Goal**: Make the orchestrator reliable enough to run continuously.

### 6.1 — Browser pool management
- Playwright adapters share a browser pool (max N concurrent browsers)
- Recycle sessions on a timer (anti-bot cookies expire)
- Graceful degradation: if browser pool is full, queue requests

### 6.2 — Rate limiting per source
- Per-adapter request quotas (e.g., Copart max 5 searches/minute)
- Backoff on 429s or anti-bot triggers
- Queue overflow handling

### 6.3 — Error recovery
- If an adapter crashes, isolate it — don't take down other adapters
- Auto-restart failed adapters after cooldown
- Circuit breaker: after N consecutive failures, disable adapter until manual re-enable

### 6.4 — Monitoring + observability
- Log structured events: search started, adapter responded, dedup count, score distribution
- Expose `/metrics` endpoint (adapter health, latency p50/p99, cache hit rate)
- FC spec evolution tracking: how many iterations before a site reaches "full extraction"

---

## Phase 7: Merge into PickNBuild

**Goal**: Integrate the orchestrator into the main project, replacing `picknbuild-be/copart-scraper/`.

### 7.1 — Schema migration
- Write Laravel migration: map `scrape_listings` columns → MySQL `vehicles` table
- Add new columns for auction-specific fields (lot_number, current_bid, auction_date, etc.)
- Migrate `scrape_sites` into a Laravel-managed table
- Migrate FC specs

### 7.2 — Service deployment
- Orchestrator runs as a sidecar Node service alongside the Laravel API
- Laravel calls orchestrator via internal HTTP (same as frontend currently calls `/search`)
- Admin dashboard gets a "Scrape Sources" management page

### 7.3 — Frontend integration
- `picknbuild1` marketplace page calls the orchestrator (via Laravel proxy or direct)
- Replace the existing Copart-only "Discovery" feed with multi-source results
- User preferences from the onboarding flow feed into search filters

### 7.4 — Retire old scraper
- Verify orchestrator covers all existing Copart scraper functionality
- Remove `picknbuild-be/copart-scraper/` directory
- Update `start-all.sh` to launch orchestrator instead
