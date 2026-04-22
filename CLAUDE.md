@AGENTS.md

# PicknBuild — build plan for agents

You are working on the PicknBuild vehicle marketplace. The product is split into **16 independent teams** so multiple humans + agents can build in parallel without blocking each other. This file is the universal briefing — read it before you touch any code, then read the team charter for whatever team you were assigned.

## Canonical docs (read in this order)

1. **`docs/requirements/ARCHITECTURE.md`** — cross-cutting rules (§2), shared data contracts (§3), the 16-team split (§4), per-team charters (§5), the ordered unblock list of contracts to stub first (§6), and the authoritative list of dropped items (§7). Everything in §2 overrides anything in a legacy spec file.
2. **`docs/requirements/COMPONENTS.md`** — one row per component with Name / Type / Owner / Inputs / Outputs / **Talks to** / Source docs. Your team's section names everything you own; the "Talks to" lines point at your seams with other teams.
3. **`docs/requirements/chud/`** and **`docs/requirements/original-spec/`** — the legacy spec files. Kept as behavior/copy references that ARCHITECTURE and COMPONENTS point back into. **`chud/DROPPED.md` is still authoritative for what was cut and why** — don't re-implement anything listed there.

If an instruction in this file disagrees with ARCHITECTURE.md §2, ARCHITECTURE wins.

## The contract-first rule

`src/contracts/` holds the 11 shared data types from ARCHITECTURE §3, each with a `makeFixture*` factory. `src/services/` holds one typed stub per backend service from §6, each returning fixture data.

- **Always import from `@/contracts` and `@/services`.** Do not redefine `ListingObject`, `PathQuote`, `ConversionState`, etc. anywhere else.
- **The contracts are frozen.** If you think a shape is wrong or missing a field, stop and flag it. A contract change is a coordinated PR that lands before any team consumes the new shape — do not edit unilaterally.
- **The services are scaffolding.** The team that owns a service replaces its stub with the real implementation. Teams that *consume* a service import the function signature and call it — they never care whether the body is a fixture or a real Stripe call.

`src/services/README.md` maps each service file to its owning team.

## Scrapers are black boxes

Auction scrapers (Copart/IAAI), Craigslist scrapers, and any other external source are assumed to exist upstream. **Do not implement or wire up a scraper.** Everything consumes `ListingObject` rows emitted by ingestion — that shape is in `src/contracts/listing-object.ts`. If you find yourself writing scraper code, stop.

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
- Scrapers are black boxes. Consume ListingObject; do not implement scrapers.
- Update TEAMS.md (claim → in progress → merged).

Deliverable: every component in your COMPONENTS.md section implemented against real contracts, with tests where applicable, and the service stubs your team owns replaced with real implementations. PR against main when done.

Start now with Team {N}.
```

## Scratch rules

- Next.js in this repo is the new version — see AGENTS.md. Read `node_modules/next/dist/docs/` for anything you're unsure about. Do not assume old APIs.
- Strict TypeScript is on (`strict: true`, `noUncheckedIndexedAccess: true`). Handle possibly-undefined array access explicitly.
- Tests live in `src/__tests__/` under Vitest. `pnpm vitest run` works; this repo uses npm for install (`npm install`) but Vitest scripts are wired in `package.json`.
- Supabase client lives in `src/lib/supabase/`. Teams that need a database table add a migration in `supabase/migrations/`.
- Do not push to `origin/main` without a merged PR. Local commits are fine.
- Do not run `git push --force`, `reset --hard`, or delete branches without the other human's sign-off.
