# PicknBuild

Vehicle marketplace built around a four-path comparison (Dealer / Auction / picknbuild / Private Seller) and a committed purchase flow with a $1,000 deposit. Next.js 16 · React 19 · Supabase · Stripe.

The product is split into **16 independent teams** that build in parallel against frozen `src/contracts/` shapes and typed `src/services/` stubs.

## Canonical docs (read in this order)

| File | What it covers |
|------|----------------|
| [`CLAUDE.md`](./CLAUDE.md) | Universal agent briefing — contract-first rule, worktree layout, dropped items, prompt template |
| [`AGENTS.md`](./AGENTS.md) | Next.js 16 breaking-change note + agent worktree operating rules |
| [`TEAMS.md`](./TEAMS.md) | Claim board + claim/retire protocol. Edit before you start a team. |
| [`docs/BUILD_PLAN.md`](./docs/BUILD_PLAN.md) | Two-person split, Max 5x batch plan, worktree setup, port table, per-team agent prompts, troubleshooting |
| [`docs/requirements/ARCHITECTURE.md`](./docs/requirements/ARCHITECTURE.md) | Cross-cutting rules (§2), shared data contracts (§3), team split (§4), per-team charters (§5), merge order (§6), dropped items (§7) |
| [`docs/requirements/COMPONENTS.md`](./docs/requirements/COMPONENTS.md) | One row per component with Inputs / Outputs / Talks-to / Source docs |

## Working tree layout (important)

The repo is used as **a parent checkout that stays on `main` plus one ephemeral worktree per active team**:

```
picknbuild/
├── picknbuild_mega/        # parent checkout — always on `main`, coordination only
├── pnb-team-1/             # ephemeral — `team-1/foundations` branch
├── pnb-team-3/             # ephemeral — `team-3/supply-data-plane` branch
└── pnb-team-7/             # ephemeral — `team-7/vehicle-detail` branch
```

Each worktree runs its own dev server on port `3000 + N` (Team 1 → 3001, Team 7 → 3007, Team 16 → 3016). Port `3000` stays free on the parent for integration smoke tests.

## Getting started

### One-time (first clone)

```bash
git clone https://github.com/elontusks/picknbuild_mega.git
cd picknbuild_mega
npm install
```

This checkout is now your **coordination tree**. Don't code in it.

### Claiming a team

From the parent checkout:

```bash
git pull origin main
# edit TEAMS.md: set your Owner, branch, Status = "in progress"
git add TEAMS.md && git commit -m "claim: team N" && git push origin main
git worktree add ../pnb-team-N -b team-N/<slug> origin/main
cd ../pnb-team-N
npm install
PORT=30NN npm run dev
```

Open the agent session with its CWD inside `../pnb-team-N/` and run the prompt template in [`CLAUDE.md`](./CLAUDE.md).

### Retiring a team (after PR merges)

From the parent checkout:

```bash
git pull origin main
# edit TEAMS.md: flip Status to "merged"
git add TEAMS.md && git commit -m "merged: team N" && git push origin main
git worktree remove ../pnb-team-N
git branch -d team-N/<slug>
```

Full protocol + port table + troubleshooting: [`docs/BUILD_PLAN.md`](./docs/BUILD_PLAN.md) §5–§6.

## Common scripts (run inside a worktree)

| Command | What it does |
|---------|--------------|
| `PORT=30NN npm run dev` | Next.js dev server on your team's port |
| `npx vitest run` | Full test suite (Vitest + Testing Library) |
| `npx vitest run src/__tests__/team-07` | Just one team's tests |
| `npx tsc --noEmit` | Typecheck |
| `npx eslint` | Lint |
| `npm run db:push` | Apply Supabase migrations — **coordinate first**, the DB is shared across every worktree |

## Guardrails

- **Contracts are frozen.** Don't edit `src/contracts/` unilaterally. If a shape is wrong, stop and coordinate a single-PR contract change that lands before any consumer imports it.
- **The scraper is in-tree, not a black box.** It lives at [`scraper/`](./scraper/) and runs on port 3099 alongside Next.js (`./start-all.sh` boots both). Add new sources as adapters under `scraper/src/adapters/`; call existing ones through `/api/scrape`, `/api/orch-health`, `/api/curated`, `/api/listings/[id]/refresh`. Don't fetch external sites directly from `src/` — go through the sidecar so the persistence + dedup + scoring pipeline is honored.
- **Honor the dropped-items list** in [`ARCHITECTURE.md` §7](./docs/requirements/ARCHITECTURE.md). If a task seems to require a dropped item, stop and flag it.
- **Never `git push --force` or `reset --hard`** without the other human's sign-off.
- **Next.js 16 has breaking changes.** Read `node_modules/next/dist/docs/` rather than relying on training data.
