@AGENTS.md

# PicknBuild — build plan for agents

You are working on the PicknBuild vehicle marketplace. The product is split into **16 independent teams** so multiple humans + agents can build in parallel without blocking each other. This file is the universal briefing — read it before you touch any code, then read the team charter for whatever team you were assigned.

## Canonical docs (read in this order)

1. **`docs/requirements/ARCHITECTURE.md`** — cross-cutting rules (§2), shared data contracts (§3), the 16-team split (§4), per-team charters (§5), the ordered unblock list of contracts to stub first (§6), and the authoritative list of dropped items (§7). Everything in §2 overrides anything in a legacy spec file.
2. **`docs/requirements/COMPONENTS.md`** — one row per component with Name / Type / Owner / Inputs / Outputs / **Talks to** / Source docs. Your team's section names everything you own; the "Talks to" lines point at your seams with other teams.
3. **`docs/BUILD_PLAN.md`** — human coordination layer: two-person split, batch plan, Max 5x realities, per-section agent prompts, claim protocol, troubleshooting. Read this before running agents.
4. **`docs/requirements/chud/`** and **`docs/requirements/original-spec/`** — the legacy spec files. Kept as behavior/copy references that ARCHITECTURE and COMPONENTS point back into. **`chud/DROPPED.md` is still authoritative for what was cut and why** — don't re-implement anything listed there.

If an instruction in this file disagrees with ARCHITECTURE.md §2, ARCHITECTURE wins.

## The contract-first rule

`src/contracts/` holds the 11 shared data types from ARCHITECTURE §3, each with a `makeFixture*` factory. `src/services/` holds one typed stub per backend service from §6, each returning fixture data.

- **Always import from `@/contracts` and `@/services`.** Do not redefine `ListingObject`, `PathQuote`, `ConversionState`, etc. anywhere else.
- **The contracts are frozen.** If you think a shape is wrong or missing a field, stop and flag it. A contract change is a coordinated PR that lands before any team consumes the new shape — do not edit unilaterally.
- **The services are scaffolding.** The team that owns a service replaces its stub with the real implementation. Teams that *consume* a service import the function signature and call it — they never care whether the body is a fixture or a real Stripe call.

`src/services/README.md` maps each service file to its owning team.

## Working tree layout

The repo runs as **a parent checkout plus one ephemeral worktree per active team**:

- `picknbuild_mega/` — always on `main`. No coding here. Reserved for `git pull`, editing `TEAMS.md`, reviewing PRs, and running ad-hoc queries.
- `../pnb-team-N/` (sibling to the parent) — where the agent for team N actually works. Created with `git worktree add ../pnb-team-N -b team-N/<slug> origin/main` when the team is claimed, removed with `git worktree remove ../pnb-team-N` once the PR merges.

Dev servers run on port `3000 + N` inside each worktree (3001 for Team 1, 3007 for Team 7, etc.) so parallel worktrees never fight over `:3000`. `:3000` stays free on the parent checkout for integration smoke tests.

When you're running as an agent, your CWD is the team worktree — not the parent. Full claim/retire protocol: `TEAMS.md` and `docs/BUILD_PLAN.md` §5–§6.

## Scrapers are in-tree — integrate, don't reinvent

The earlier "scrapers are black boxes" rule no longer applies. The scraper sidecar lives at **`scraper/`** in this repo and runs on **port 3099** alongside the Next.js app (`./start-all.sh` boots both). It owns Copart (Playwright), IAAI (Playwright), and Firecrawl-driven adapters (Cars.com, BaT, dealer sites), persists results to the same Supabase Postgres the Next.js app reads from via a service-role client, and exposes:

- `GET /health` — adapter readiness
- `POST /search` — multi-source search (also persists rows)
- `GET /preview` — quick search via querystring
- `GET /vehicle/:source/:id` — single vehicle detail
- `POST /refresh/:listingId` — re-scrape + diff for an existing row
- `GET /curated` — hottest-auctions feed
- `POST /ingest/run` — manually trigger the daily-ingest job

The Next.js side proxies these through `/api/scrape`, `/api/orch-health`, `/api/curated`, `/api/listings/[id]/refresh`, and `/api/scrape-sites`. Use those proxy routes from app code — they handle auth and error wrapping. `src/lib/scraper/client.ts` is the typed HTTP boundary; `ScraperUnavailableError` is what to catch when the sidecar is down.

Rules for agents going forward:

- **Need data from a new source?** Add an adapter under `scraper/src/adapters/` and register it in `scraper/src/server.ts`. Don't add a one-off fetch in app code.
- **Need a new scraper capability (progress events, URL-targeted scrape, etc.)?** Land the endpoint in the scraper, expose it through a proxy under `src/app/api/`, and only then consume from React.
- **Schema change?** The scraper writes `listings` directly with the same constraints app code reads. Coordinate any column add/widen in `supabase/migrations/` AND keep `ListingSource` in `src/contracts/listing-object.ts` in sync. The `firecrawl` source drift in `KNOWN_ISSUES.md#1` is the cautionary tale.
- **Still don't roll your own scraping logic in `src/`.** That's separate from "extend the in-tree scraper" — app code talks to `localhost:3099`, not Playwright/Firecrawl directly.
- **Test plans must include the round-trip.** A change that touches scrape → DB → UI isn't done until you've confirmed a real scrape lands rows that surface in the right column.

If something seems to need scraper logic but the existing endpoints don't fit, stop and propose the shape of a new endpoint before writing it — the orchestrator's response contract is consumed in several places.

## Strip before production

The repo carries a few dev-only conveniences that must be removed (or hard-gated) before any production deploy. They're in-tree because local dev needs them; they're listed here so nothing slips out.

- `src/app/api/dev/admin-login/route.ts` — password sign-in for the dummy admin. Already returns 404 when `NODE_ENV === "production"`, but delete the file (and its directory) before shipping; defense-in-depth, no dev surface in prod.
- `scripts/seed-dummy-admin.mjs` — provisions the dummy admin account (`admin-dummy@picknbuild.local` / fixed password). Local-only seeder; do not run against prod Supabase. Delete or move under a `dev/` folder excluded from prod builds.
- `supabase/migrations/20260425000000_seed_listings_ohio.sql` — six seed listings around ZIP 43065 for local testing. Idempotent, but seed data does not belong in prod. Either drop the migration before pushing schema to prod, or guard it with an environment check inside the SQL.
- `AUDIT_TODO.md` — internal audit punch list. Ship-safe, but it's a working doc; treat it as part of internal docs, not customer-facing material.

## Dropped items (quick reference)

Do NOT build any of these. If a task seems to require one, flag it and stop. Full list + reasoning in ARCHITECTURE §7 + `docs/requirements/chud/DROPPED.md`.

- Reality Check Engine · Dreamer / Delayer / Decider user states · "What Matters Most" selector and "See Cars You Can Get Today" CTA · Empty-state "no dead ends" estimated-paths layer · Katzkin seat integration · "Build Your Deal" interactive multi-step calculator (the Configurator page is a different thing, keep building it) · Paid Auction Service (Auction is DIY compare-only, **no platform-run bidding**, no $2,500 fee, no "Auction Support Started" state) · Dealer scraping / claim flow · Leaderboard + contests · Trust verification / trust badges · Transaction tracking / outcome inference · Empty-state recovery surface · Duplicate detection · Historical price tracking · Dealer credit estimator · Shipping estimate · Location-aware pricing · Invite / referral system · Urgency as a first-class intake field · PicknBuild delivery as a separate product · "Found a Better Deal" marketed as a separate feature (same capability = Link Parser in Team 3) · Report / moderation queue (Team 15 does ad-hoc manual moderation only).

## Team ownership (from ARCHITECTURE §4)

| # | Team | What you own |
|---|------|--------------|
| 1 | Foundations | Auth (phone-verified signup), onboarding wizard, `User` record, global shell, mobile nav, responsive framework, legal-disclaimer copy library |
| 2 | Profiles | Buyer / Dealer / Individual-Seller profiles + Dealer Page Edit Panel |
| 3 | Supply / Data Plane | Ingestion normalizer → `ListingObject` store, on-view refresh with cooldowns, idle sweep, Link Parser, VIN lookup, user-generated + dealer-posted listing UIs |
| 4 | Search Intake | Top Controls bar, credit input, clean/rebuilt, Match Mode, link parser input, `IntakeState` store |
| 5 | Four-Path Comparison | The four path cards (Dealer / Auction / picknbuild / Private), path row, title / risk / best-fit badges, sponsor boards |
| 6 | Decision & Gap | Your Best Path Right Now, See Where You Stand, Choose Your Term, per-path gap modules, Buying Power layer + viz |
| 7 | Vehicle Detail | Vehicle Detail View, All-Paths Display, Available Actions bar, Comments/Replies, Vehicle Card / Summary Card |
| 8 | Garage | Garage container, grouping, item card, comparison table, decision highlights, actions, garage filters |
| 9 | Commit / Checkout | picknbuild Configurator, packages, Live Price Panel, customizations, Add-to-Build, Agreement form, Signature, $1,000 Stripe Deposit |
| 10 | Post-Deposit Dashboard | Customer dashboard, status timeline, payment history, wire instructions, Upgrade/Downgrade/Surrender flows |
| 11 | Pricing & Intelligence Backend | Credit-tier resolver, picknbuild formula, bi-weekly, Dealer APR, Trade-In, Already-Have-a-Car, Recommendation, Pricing Guidance, Inspection, Match Mode |
| 12 | Workflows Backend | Two-step conversion state machine, post-deposit "Build Started" workflow, dealer-lead signal flow, private-seller-invite flow |
| 13 | Messaging + Notifications | Socket transport, inbox + threads, three chat kinds, Notification Service, bell + toasts + preferences + digest |
| 14 | Payments Backend | Stripe (charges/refunds/subs), subscription lifecycle, refund reconciliation, failed-payment recovery, payment tracking, wire instructions, dealer lead-unlock + per-listing fees |
| 15 | Admin + Integrity | Admin Dashboard, logging, monitoring, data privacy controls, secure storage layer, sponsor catalog |
| 16 | Feed | Feed surface, post templates, engagement controls, media upload, vehicle card in feed, clustering stub |

## Merge order (ARCHITECTURE §6)

Teams land onto `main` in dependency order. Do not merge out of order — consumers need the emitter's contract live:

1. Team 1 Foundations (everyone needs `User` + shell)
2. Team 3 Supply
3. Team 11 Pricing & Intelligence
4. Team 15 Secure Storage Layer (thin slice — many teams persist through it)
5. Team 14 Payments
6. Team 12 Workflows
7. Team 13 Messaging + Notifications
8. Team 2 Profiles
9. Team 4 Search Intake
10. Team 5 Four-Path Comparison
11. Team 6 Decision & Gap
12. Team 7 Vehicle Detail
13. Team 8 Garage
14. Team 9 Commit / Checkout
15. Team 10 Post-Deposit Dashboard
16. Team 16 Feed

## Two-person split

The 16 teams group cleanly at the deposit line:

- **Person A — pre-deposit funnel:** Teams 1, 3, 4, 5, 6, 7, 11, 16.
- **Person B — post-selection + services:** Teams 2, 8, 9, 10, 12, 13, 14, 15.

Neither side blocks the other because every cross-team consumer imports from `@/services` where the stubs already return fixtures.

## Realistic batch plan (both humans on Max 5x)

Running ~16 concurrent subagents will blow the quota. Target **2–3 concurrent subagents per person**, batched. `TEAMS.md` is your claim board — claim before starting, merge before the next batch.

Person A:
1. Team 1 alone (everyone depends on it).
2. Teams 3 + 11 in parallel.
3. Teams 4 + 7 in parallel.
4. Teams 5 + 6 in parallel.
5. Team 16 alone.

Person B:
1. Team 15 secure-storage slice alone.
2. Teams 14 + 12 in parallel.
3. Teams 2 + 13 in parallel.
4. Teams 9 + 8 in parallel.
5. Team 10 alone.

## Prompt template — paste this to a fresh Claude Code session for a team

```
You are Team {N} for the PicknBuild build.

You are running inside a git worktree at ../pnb-team-{N}/ that is already on branch team-{N}/<slug>. The parent checkout at picknbuild_mega/ stays on main — don't cd up and commit there. Run your dev server with `PORT=30{NN} npm run dev` (e.g. PORT=3007 for Team 7) so you don't collide with other worktrees.

Read in this order:
1. CLAUDE.md (this file) — overall plan + constraints
2. docs/requirements/ARCHITECTURE.md §2 — cross-cutting rules (these override anything else)
3. docs/requirements/ARCHITECTURE.md §5 "Team {N}" — your charter
4. docs/requirements/ARCHITECTURE.md §3 — every shared contract you consume or publish
5. docs/requirements/COMPONENTS.md — your team's section (components you own, their Inputs / Outputs / Talks-to)
6. docs/requirements/COMPONENTS.md — the rows for every component named in your "Talks to" lines, so you know the shape the other side exposes
7. src/contracts/ — the frozen types + fixture factories
8. src/services/team-*.ts — the stubbed backend surface

Rules:
- Import every shared type from @/contracts. Do not redefine.
- For cross-team calls, import from @/services. Do not reach around the stubs.
- If your team owns a service file in src/services/, replace the stub with a real implementation as part of your work.
- Do NOT modify src/contracts/ or another team's service signatures. If something is wrong, stop and flag.
- Honor ARCHITECTURE §7 Dropped items. Stop and flag if a task seems to require one.
- The scraper sidecar at `scraper/` (port 3099) is part of this workspace. Call it via `/api/scrape`, `/api/orch-health`, `/api/curated`, `/api/listings/[id]/refresh` — don't reimplement scraping in `src/`. To add a source, add an adapter under `scraper/src/adapters/` and register it.
- Update TEAMS.md (claim → in progress → merged).

Deliverable: every component in your COMPONENTS.md section implemented against real contracts, with tests where applicable, and the service stubs your team owns replaced with real implementations. PR against main when done.

Start now with Team {N}.
```

## Scratch rules

- Next.js in this repo is the new version — see AGENTS.md. Read `node_modules/next/dist/docs/` for anything you're unsure about. Do not assume old APIs.
- Strict TypeScript is on (`strict: true`, `noUncheckedIndexedAccess: true`). Handle possibly-undefined array access explicitly.
- Tests live in `src/__tests__/` under Vitest. `pnpm vitest run` works; this repo uses npm for install (`npm install`) but Vitest scripts are wired in `package.json`.
- Supabase client lives in `src/lib/supabase/`. Teams that need a database table add a migration in `supabase/migrations/`. The DB is shared across every worktree — coordinate before running `supabase db push`.
- Do not code or run `next dev` in the parent `picknbuild_mega` checkout. That tree stays on `main`. All feature work lives in the team worktree (`../pnb-team-N/`). Dev server: `PORT=30NN npm run dev` inside the worktree.
- Do not push to `origin/main` without a merged PR. Local commits are fine.
- Do not run `git push --force`, `reset --hard`, or delete worktrees/branches without the other human's sign-off.
