# Known issues

Tracking real, observed gaps in the live-scrape → DB → UI round-trip.
Each entry says what was seen, where the root cause lives, and current
fix status. Update when an issue is fully resolved or a new one is found.

---

## 1. Firecrawl-source listings dropped in the UI — **FIXED**

**Symptom:** A live `/search` against Cars.com (and other Firecrawl-driven
adapters) wrote rows to Supabase with `source = "firecrawl"`, but those
rows never appeared in any column on `/browse`. Verified by query: 3 Honda
firecrawl rows in DB, 0 visible.

**Root cause:** The scraper migration
(`supabase/migrations/20260425100000_scraper_tables.sql`) widened the
`listings.source` check constraint to include `'firecrawl'`, but the
frontend `ListingSource` union in `src/contracts/listing-object.ts` and
the three `Record<ListingSource, …>` maps in
`src/lib/search-demo/listing-to-car.ts` were never updated. Every
firecrawl row resolved to `path: undefined`, so the bucketing in
`loadSearchListings` skipped them.

**Fix in this PR:**
- `firecrawl` added to `ListingSource` union.
- `firecrawl → "dealer"` added to `SOURCE_TO_PATH` (Cars.com is a
  dealer-listing aggregator).
- `firecrawl → "low"` added to `SOURCE_TO_EFFORT` and `SOURCE_TO_RISK`.
- `firecrawl → HOUR_MS` added to `REFRESH_COOLDOWN_MS`
  (`src/lib/listings/refresh.ts`).
- `isPicknbuildEligible` now accepts firecrawl rows when the title is clean.
- Tests added in `listing-to-car.test.ts` + `refresh.test.ts`.

---

## 2. Copart adapter blocked by Incapsula anti-bot — **OPEN, upstream**

**Symptom:** Every `/search` log ends with "Persisted 0 listings for
copart". The Copart Playwright adapter retries 3× and gives up:
"Anti-bot challenge — session refreshed, retry" → "Search page 1 failed
after 3 attempts".

**Root cause:** Copart's Incapsula challenge isn't being solved by the
current headless-browser session refresh strategy
(`scraper/src/adapters/copart.ts`). Even with `HEADLESS=false` exposed as
a workaround, headless mode is what the production sidecar runs.

**Why not fixed here:** Out of scope for the frontend PR. Requires
upstream changes in the scraper adapter — likely real-browser session
warmup, residential proxy rotation, or an explicit Copart cookie store
seeded from a manual browse.

**User-visible impact today:** Auction column gets IAAI-only data. When
IAAI also fails to find matches, the column falls into the empty state
correctly (paste-link still works). Search results lose ~50% potential
auction inventory.

**Mitigation in app:** None today. The column's "live search offline"
state is the right fallback when the scraper as a whole errors out, but
Copart-only failures are silent — search succeeds with partial results.

---

## 3. Loose match on the orchestrator's `/search` — **OPEN**

**Symptom:** `make=Honda model=Civic year=2018` returned 13 rows
including Honda CR-V, Pilot, Accord, Fit, Odyssey across years 1998–2016.
Match scores 10–20 (out of 115). The frontend's `applyIntakeFilters`
then strict-filters these out, so the user sees "no auction matches yet"
after the loading bar finishes — making the live scrape feel useless.

**Root cause:** Two layers compound:
1. The scraper bands the requested year ±2 (sent to upstream sites as
   `yearFrom: 2015, yearTo: 2019` for `year=2018`). Reasonable for
   recall.
2. Model matching is fuzzy/substring on the upstream sites, so "Civic"
   matches anything starting with `C-` or sharing letters.
3. The orchestrator's hard filters (`scraper/src/core/orchestrator.ts`,
   "Hard filters before scoring: location too far, mileage >1.5×
   target, price > 60% of budget") don't include a model-token check.

**Why not fixed here:** Two clean options, both bigger than this PR:
- (a) After live-scrape, refetch `/api/listings?make=…&model=…&yearMin=…
   &yearMax=…` (which DOES filter strictly) instead of refetching all
   listings and bucket-filtering client-side. Then surface "13 close
   matches" UI separately if you want recall.
- (b) Tighten the orchestrator's model-match in
  `scraper/src/core/orchestrator.ts` `prefsToFilters`.

**User-visible impact today:** Live-scrape can complete with `success:
true, total: 13` and yet the auction column still shows the empty state,
because the strict client filter rejected all 13. Confusing.

**Mitigation in app:** None today. Worth doing (a) in a follow-up.

---

## 4. Critical fields are zero/null on scraped rows — **OPEN, partial mitigation**

**Symptom (from a real `/search` of `Honda Civic 2018`):**

| Field          | IAAI rows       | Cars.com (firecrawl) rows |
| -------------- | --------------- | ------------------------- |
| `vin`          | `null`          | populated                 |
| `current_bid`  | `0`             | n/a                       |
| `price`        | `0`             | populated                 |
| `photos`       | `[]`            | populated                 |
| `location_zip` | `null`          | populated                 |

**Root cause:**
- IAAI doesn't expose VIN/exact-bid pre-purchase; the adapter has nothing
  to extract.
- IAAI photos sit behind authenticated requests the adapter doesn't
  perform.
- `current_bid: 0` is stored as a literal zero rather than `null`, which
  conflates "auction hasn't started yet / no bid yet" with "free".

**Mitigation already in app:** Path columns derive their display values
from `acv` (estimated cash value) with sensible fallbacks — e.g. dealer
column: `if (currentCar?.acv && currentCar.acv > 0) return currentCar.acv;
… mean across pool; … else 0`. So pricing math doesn't blow up.

**Remaining gap:** `CarCard` may render `$0` for `current_bid` /
`price` when those are stored as 0. Better UX is "TBD" or "—" until a
real bid lands.

**Why not fixed here:** Touching `CarCard` price rendering risks breaking
the affordability indicator UI that already handles 0 with fallbacks.
Worth a focused follow-up: change the adapter to write `null` instead of
`0` for "unknown bid" so downstream consumers can render the right
string.

---

## How to add an entry

1. Reproduce the issue and capture the smoking gun (a query result, a
   log line, a curl output). Pasting it inline beats a vague "X is
   broken".
2. Name the root cause file + line if you have it.
3. Mark status — `FIXED`, `OPEN`, `OPEN, upstream` (someone else owns it),
   `OPEN, partial mitigation`. Don't write `WONTFIX` without a reason.
4. If you fix one, change `OPEN` → `FIXED` and link the PR.
