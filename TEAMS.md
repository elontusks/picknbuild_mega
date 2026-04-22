# Team Claim Board

Before you start work on a team, edit this file to put your name in the **Owner** column and set **Status** to `in progress`. Commit + push TEAMS.md *first*, then start coding in a branch named `team-NN/<slug>`. This file is your lock — if Owner is already filled, the team is taken.

Merge into `main` in the order given in **Merge priority** (matches ARCHITECTURE §6). Lower numbers unblock higher ones.

## How to claim

1. `git pull origin main`
2. Edit your row: set **Owner**, set **Branch** (e.g. `team-1/foundations`), set **Status** to `in progress`.
3. `git add TEAMS.md && git commit -m "claim: team N" && git push origin main`
4. Create your branch: `git checkout -b team-N/<slug>`
5. Read `CLAUDE.md` → `docs/requirements/ARCHITECTURE.md` → `docs/requirements/COMPONENTS.md`, then start your team's work using the prompt template in `CLAUDE.md`.
6. When done, open a PR against `main`. The *other* human reviews.
7. When merged, update your row: **Status** = `merged`.

## Do not touch without coordination

- `src/contracts/` — these shapes are frozen after the initial commit. Changing one breaks every team. If you need a change, stop and post to the shared channel; land a single coordinated contract PR before continuing.
- `src/services/team-*.ts` — replacing the stub with the real impl is your job if you own that team. **Do not change another team's service signatures.** Add to them if you need a new endpoint, don't modify the existing ones.

## Teams

| # | Team | Merge priority | Owner | Branch | Status |
|---|------|---------------:|-------|--------|--------|
| 1 | Foundations (auth, onboarding, User, shell) | 1 | athin shetty | team-1/foundations | merged |
| 3 | Supply / Data Plane (listing store, link parser, VIN) | 2 | athin shetty | team-3/supply-data-plane | merged |
| 11 | Pricing & Intelligence Backend | 3 | athin shetty | team-11/pricing-intelligence | merged |
| 12 | Workflows Backend (conversion state, signals) | 4 | _(unclaimed)_ | — | not started |
| 13 | Messaging + Notifications | 5 | _(unclaimed)_ | — | not started |
| 14 | Payments Backend (Stripe, subs, refunds) | 6 | _(unclaimed)_ | — | not started |
| 15 | Admin + Integrity (dashboard, logging, storage) | 7 | amogh kuppa | team-15/secure-storage | storage slice merged; admin UI pending |
| 2 | Profiles (buyer/dealer/seller + dealer edit) | 8 | _(unclaimed)_ | — | not started |
| 4 | Search Intake (top controls, IntakeState) | 9 | athin shetty | team-4/search-intake | merged |
| 5 | Four-Path Comparison | 10 | _(unclaimed)_ | — | not started |
| 6 | Decision & Gap (Best Path, See Where You Stand) | 11 | _(unclaimed)_ | — | not started |
| 7 | Vehicle Detail | 12 | athin shetty | team-7/vehicle-detail | in progress |
| 8 | Garage | 13 | _(unclaimed)_ | — | not started |
| 9 | Commit / Checkout (configurator, deposit) | 14 | _(unclaimed)_ | — | not started |
| 10 | Post-Deposit Dashboard | 15 | _(unclaimed)_ | — | not started |
| 16 | Feed | 16 | _(unclaimed)_ | — | not started |

## Suggested two-person split

- **Person A — pre-deposit funnel:** Teams 1, 3, 4, 5, 6, 7, 11, 16.
- **Person B — post-selection + services:** Teams 2, 8, 9, 10, 12, 13, 14, 15.

Full batch plan, daily rhythm, agent prompts, Max 5x concurrency limits, and troubleshooting: [`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md).
