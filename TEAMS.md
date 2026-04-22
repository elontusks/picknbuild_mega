# Team Claim Board

Before you start work on a team, edit this file to put your name in the **Owner** column and set **Status** to `in progress`. Commit + push TEAMS.md *first*, then spin up a **worktree** for your team and do all coding there. This file is your lock — if Owner is already filled, the team is taken.

Merge into `main` in the order given in **Merge priority** (matches ARCHITECTURE §6). Lower numbers unblock higher ones.

## Working tree layout

Every active team lives in its **own git worktree** sibling to this checkout. The parent checkout (`picknbuild_mega/`) stays permanently on `main` and is reserved for coordination: pulling, editing this file, reviewing PRs. All coding happens inside a team worktree at `../pnb-team-N/`.

- Worktrees are created fresh when you claim a team and destroyed when the PR merges.
- Each worktree runs its own dev server on port `3000 + N` (Team 1 → 3001, Team 7 → 3007, Team 16 → 3016) so parallel worktrees never collide on :3000.
- Full setup + port table + troubleshooting: `docs/BUILD_PLAN.md` §5–§6.

## How to claim

Run steps 1–3 from the **parent checkout** (on `main`), then 4+ from the new worktree.

1. `git pull origin main`
2. Edit your row: set **Owner**, **Branch** (e.g. `team-1/foundations`), **Status** = `in progress`.
3. `git add TEAMS.md && git commit -m "claim: team N" && git push origin main`
4. Spawn the worktree: `git worktree add ../pnb-team-N -b team-N/<slug> origin/main`
5. `cd ../pnb-team-N && npm install` (first spawn only; `node_modules/` persists in the worktree afterwards).
6. Read `CLAUDE.md` → `docs/requirements/ARCHITECTURE.md` → `docs/requirements/COMPONENTS.md`, then run your agent inside the worktree using the prompt template in `CLAUDE.md`. Dev server: `PORT=30NN npm run dev`.
7. When done, open a PR against `main` from the worktree. The *other* human reviews.

## How to retire

Run from the parent checkout once the PR has merged.

1. `git pull origin main`
2. Edit your row: **Status** = `merged`.
3. `git add TEAMS.md && git commit -m "merged: team N" && git push origin main`
4. `git worktree remove ../pnb-team-N`
5. `git branch -d team-N/<slug>` (the remote branch auto-cleans if you used `gh pr merge --delete-branch`).

## Do not touch without coordination

- `src/contracts/` — these shapes are frozen after the initial commit. Changing one breaks every team. If you need a change, stop and post to the shared channel; land a single coordinated contract PR before continuing.
- `src/services/team-*.ts` — replacing the stub with the real impl is your job if you own that team. **Do not change another team's service signatures.** Add to them if you need a new endpoint, don't modify the existing ones.

## Teams

| # | Team | Merge priority | Owner | Branch | Status |
|---|------|---------------:|-------|--------|--------|
| 1 | Foundations (auth, onboarding, User, shell) | 1 | athin shetty | team-1/foundations | merged |
| 3 | Supply / Data Plane (listing store, link parser, VIN) | 2 | athin shetty | team-3/supply-data-plane | merged |
| 11 | Pricing & Intelligence Backend | 3 | athin shetty | team-11/pricing-intelligence | merged |
| 12 | Workflows Backend (conversion state, signals) | 4 | amogh kuppa | team-12/workflows | merged |
| 13 | Messaging + Notifications | 5 | amogh kuppa | team-13/messaging | in progress |
| 14 | Payments Backend (Stripe, subs, refunds) | 6 | amogh kuppa | team-14/payments | merged |
| 15 | Admin + Integrity (dashboard, logging, storage) | 7 | amogh kuppa | team-15/secure-storage | storage slice merged; admin UI pending |
| 2 | Profiles (buyer/dealer/seller + dealer edit) | 8 | amogh kuppa | team-2/profiles | in progress |
| 4 | Search Intake (top controls, IntakeState) | 9 | athin shetty | team-4/search-intake | merged |
| 5 | Four-Path Comparison | 10 | athin shetty | team-5/four-path | merged |
| 6 | Decision & Gap (Best Path, See Where You Stand) | 11 | athin shetty | team-6/decision-gap | merged |
| 7 | Vehicle Detail | 12 | athin shetty | team-7/vehicle-detail | merged |
| 8 | Garage | 13 | _(unclaimed)_ | — | not started |
| 9 | Commit / Checkout (configurator, deposit) | 14 | _(unclaimed)_ | — | not started |
| 10 | Post-Deposit Dashboard | 15 | _(unclaimed)_ | — | not started |
| 16 | Feed | 16 | _(unclaimed)_ | — | not started |

## Suggested two-person split

- **Person A — pre-deposit funnel:** Teams 1, 3, 4, 5, 6, 7, 11, 16.
- **Person B — post-selection + services:** Teams 2, 8, 9, 10, 12, 13, 14, 15.

Full batch plan, daily rhythm, agent prompts, Max 5x concurrency limits, and troubleshooting: [`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md).
