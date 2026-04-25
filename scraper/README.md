# PicknBuild Scraper Service

Sidecar Node service that runs alongside the Next.js app. Fans out searches to
Copart (Playwright), IAAI (Playwright), and Firecrawl-driven sites (Cars.com,
etc.), normalizes everything, deduplicates by VIN, scores against user
preferences, and writes results into the same Supabase Postgres database the
Next.js app reads from.

Ported from `athin-scraper/scrape-orch`. The SQLite layer was replaced with a
Supabase service-role client; everything else (adapters, scoring, FC spec, daily
ingest cron, refresh route) is the same shape.

## Architecture

```
  Next.js (picknbuild_mega) ── /api/scrape ──┐
                              /api/curated   │ HTTP (port 3099)
                              /api/orch-health
                              /api/listings/[id]/refresh
                                              ▼
                              ┌────────── scraper ──────────┐
                              │  Orchestrator               │
                              │   ├── Copart  (Playwright)  │
                              │   ├── IAAI    (Playwright)  │
                              │   └── Firecrawl adapters    │  (one per active
                              │       (Cars.com, BaT, etc.) │   row in scrape_sites
                              │                             │   with a search_url_template)
                              │  Daily-ingest cron          │
                              │  Refresh route              │
                              └─────────────┬───────────────┘
                                            │
                                            ▼
                                     Supabase Postgres
                                       ├── listings  (canonical, plus scraper-extra columns)
                                       ├── scrape_sites
                                       ├── scrape_runs
                                       ├── curated_listings
                                       ├── listing_refresh_runs
                                       └── unsupported_domains
```

## Run it

```bash
# from picknbuild_mega/
npm install                    # Next.js deps
npm run scraper:install        # scraper deps + chromium browser

# in one terminal
npm run dev                    # Next.js on :3000

# in another
npm run scraper:dev            # scraper on :3099
```

Or both at once:

```bash
./start-all.sh
```

## Required env vars (in `picknbuild_mega/.env.local` or `.env`)

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SECRET_KEY` | Service-role key (bypasses RLS for scraper writes) |
| `FIRECRAWL_API_KEY` | Firecrawl LLM extraction (Cars.com, BaT, dealer sites) |
| `SCRAPER_URL` | Override scraper URL for the Next.js side. Default `http://localhost:3099` |
| `ORCH_PORT` | Override scraper listen port. Default `3099` |
| `INGEST_CRON` | Cron schedule for daily-ingest. Default `0 4 * * *` |
| `DISABLE_INGEST_CRON` | `1` to disable the daily-ingest cron |
| `REFRESH_DEBOUNCE_SECONDS` | Min seconds between re-scrapes of the same listing. Default `900` |

## Endpoints (scraper, port 3099)

| Route | Method | Purpose |
|---|---|---|
| `/health` | GET | Status + adapter readiness |
| `/search` | POST | Multi-source search → scored vehicles (also persists to listings) |
| `/preview` | GET | Quick search via query params |
| `/vehicle/:source/:id` | GET | Single vehicle details |
| `/refresh/:listingId` | POST | Re-scrape + diff for a stored listing |
| `/refresh/:source/:srcId` | POST | Same, by (source, source_external_id) |
| `/curated` | GET | Hottest-auctions feed (top 10 per source) |
| `/ingest/run` | POST | Manually trigger the daily-ingest job |

## Endpoints (Next.js proxy, port 3000)

| Route | Method | Purpose |
|---|---|---|
| `/api/orch-health` | GET | Proxy → scraper `/health` |
| `/api/curated` | GET | Proxy → scraper `/curated` |
| `/api/scrape` | POST | Proxy → scraper `/search` (with auth gating) |
| `/api/scrape-sites` | GET/POST | Manage scrape_sites rows directly via Postgres |
| `/api/listings/[id]/refresh` | POST | Tries scraper `/refresh` first, falls back to in-process bump for non-scraped rows |

## Schema

The migration at `supabase/migrations/20260425100000_scraper_tables.sql` adds:

- **scrape_sites** — registry of sources + evolving FC specifications
- **scrape_runs** — per-attempt audit log
- **curated_listings** — daily "hottest" feed projection
- **listing_refresh_runs** — diff history for on-view refreshes
- **unsupported_domains** — failure blocklist
- New columns on **listings** for the rich scraper output (auction_time_left,
  primary_damage, engine, transmission, exterior_color, has_keys,
  match_score, etc.). All nullable; existing consumers see no change.

The `listings.source` check constraint was widened to include `'firecrawl'` for
non-Copart/IAAI/Craigslist scraped rows. The authoritative source is
`scrape_site_id` (FK to `scrape_sites`).

To regenerate the typed client after applying the migration:

```bash
npm run db:push      # apply migration to linked Supabase project
npm run db:types     # regenerate src/lib/supabase/database.types.ts
```

## Scoring

Vehicles from every source are scored 0–115 against user preferences:

- Year proximity (30) · Mileage (25) · Price/value (25) · Location (15)
- Title match (10) · Has keys (5) · Has image (5)

Hard filters before scoring: location too far, mileage >1.5× target,
price > 60% of budget.

## FC Specification

Each `scrape_sites` row has an `fc_specification` text column that evolves
after every scrape — Firecrawl prompts get appended notes like
`[ts] Partial — missing: vin, title_status. Try harder.` Capped at 2000 chars,
sanitized for stored prompt injection before use.
