# Build plan — running PicknBuild with two humans + agents

The universal agent briefing is in root `CLAUDE.md`. This doc is the **human coordination layer** — how two people with separate machines run agents concurrently, claim teams, avoid colliding, and land the 16-team build without stepping on each other. Read this once; refer back when you're unsure who does what next.

---

## 1. The model in one paragraph

The product is split into 16 independent teams (see ARCHITECTURE §4). Teams consume each other's work through **frozen contracts** in `src/contracts/` and **typed service stubs** in `src/services/` — so a team can build fully against fixtures without waiting for its dependencies to be real. Two humans split the 16 teams roughly in half at the deposit line. Each human runs a small number of agents in parallel (Max 5x can't support 8 concurrent agents per person) and merges to `main` in the order specified in ARCHITECTURE §6. The git remote is the only coordination point; nothing else needs to be shared between machines.

---

## 2. Roles and the deposit-line split

- **Person A — pre-deposit funnel:** Teams 1, 3, 4, 5, 6, 7, 11, 16. The discover → compare → decide half of the app.
- **Person B — post-selection + services:** Teams 2, 8, 9, 10, 12, 13, 14, 15. The commit → execute half, plus the horizontal backend services that power it.

Why this split: each side has a foundational data-producer team early (A gets listings + pricing; B gets state machine + messaging), so neither waits on the other to make progress.

### The three seams between you

These are the only contract edges that actually cross the split. Fixtures cover them until merge day; after that they wire up automatically if the contracts didn't drift.

1. **Path-card `select(path)` → `Two-Step Conversion State Machine`** (Person A Team 5/8 → Person B Team 12)
2. **`ListingObject` reads → `Garage View` + `Customer Dashboard`** (Person A Team 3 → Person B Teams 8, 10)
3. **picknbuild `PathQuote` → `picknbuild Configurator` hydration** (Person A Team 11 → Person B Team 9)

If you need a fourth seam, that's a contract change — stop and coordinate before you invent one at the call site.

---

## 3. Max 5x quota reality

You both have Max 5x. Subagents run under your logged-in subscription — **no separate `ANTHROPIC_API_KEY` needed, no API credits required.** But each subagent has its own context window, so N parallel subagents ≈ N× token burn. Max 5x cannot support 8 concurrent team-build subagents; your 5-hour window will collapse in minutes.

**Realistic concurrency per person on Max 5x:** 2–3 subagents at a time. Higher if the teams are small (Team 16 Feed, Team 2 Profiles), lower if they're heavy (Team 5 Four-Path, Team 9 Configurator).

**Safety rules while running agents:**

- Don't start a new batch in the same 5-hour window you just finished one in — the previous agents are still on your token meter until reset.
- Keep one Claude session free *outside* the subagents so you can review diffs and unstick a drifting agent. If every token is in a subagent, you can't steer.
- If you need more headroom for a specific push, upgrade one person temporarily to Max 20x for 2–3 days rather than both staying on 5x.
- Turn on "extra usage" (pay-as-you-go overage) so sessions don't halt mid-team if you blow the window.

---

## 4. Batch plan

Each person runs 5 batches, dependency-ordered per ARCHITECTURE §6. Batches roughly map to 5-hour quota windows.

### Person A

| Batch | Teams | Why this group | Expected wall time |
|------:|-------|----------------|--------------------|
| 1 | **1** alone | `User` + shell — everyone depends on it | ~1 window |
| 2 | **3 + 11** parallel | Listings + pricing — both unblock cards/gap | ~1 window |
| 3 | **4 + 7** parallel | IntakeState + Vehicle Detail — independent | ~1 window |
| 4 | **5 + 6** parallel | Four-path + Decide/Gap — both consume pricing | ~1 window |
| 5 | **16** alone | Feed — not blocking anything | ½ window |

### Person B

| Batch | Teams | Why this group | Expected wall time |
|------:|-------|----------------|--------------------|
| 1 | **15 secure-storage slice** alone | Teams 9, 13, 14 persist through it | ½ window |
| 2 | **14 + 12** parallel | Stripe + workflows state machine — independent | ~1 window |
| 3 | **2 + 13** parallel | Profiles + messaging — independent | ~1 window |
| 4 | **9 + 8** parallel | Configurator + Garage — both consume T11 pricing fixtures | ~1 window |
| 5 | **10** alone | Post-deposit — depends on 9, 12, 14 being done | ½ window |

Expected total: **5–7 calendar days** end-to-end, including integration.

---

## 5. Per-machine setup (one-time)

Each machine clones the repo once and (optionally) creates worktrees per team so parallel agents don't fight over `node_modules`, ports, and `.env`.

```bash
git clone https://github.com/elontusks/picknbuild_mega.git
cd picknbuild_mega
npm install

# Optional — only if you're running subagents in parallel on this machine
for team in 1 3 4 5 6 7 11 16; do            # ← Person A's teams
  git worktree add ../pnb-team-$team -b team-$team/main origin/main
done
```

On Person B's machine substitute `2 8 9 10 12 13 14 15`.

Worktrees are local — they don't need to be shared, and the branches only matter once you push them. If the worktree overhead feels like too much, skip it and just use branches in one checkout. The cost: subagents in the same checkout share `node_modules`/dev-server ports.

---

## 6. Claiming a team — the TEAMS.md protocol

`TEAMS.md` at the repo root is your lock. You must claim before you start so the other human can't accidentally pick up the same team.

```
git pull origin main
# Edit TEAMS.md: set your Owner, branch (team-N/<slug>), status "in progress"
git add TEAMS.md
git commit -m "claim: team N"
git push origin main
git checkout -b team-N/<slug>
```

Then start the agent with the prompt from §8.

When the team lands:

```
# update TEAMS.md: status "merged"
git add TEAMS.md
git commit -m "merged: team N"
git push origin main
```

---

## 7. Daily rhythm

- **Morning:** both fetch, skim `TEAMS.md`, claim what you'll tackle today.
- **During:** each agent opens a PR against `main` when its team is done. **The *other* human reviews.** Cross-review catches contract mismatches you won't see in your own code.
- **Mid-day check:** glance at the claim board to see what's moving and whether your next batch is unblocked.
- **End of day:** make sure nothing you own is left in `in progress` without a visible PR — if it is, push what you have and note the state in TEAMS.md.

---

## 8. Two ways to run an agent

### 8a. Per-team prompt (one team at a time)

Use this when you want tight control over one team. The template is in `CLAUDE.md` § "Prompt template".

### 8b. Per-section prompt (one agent, long sequence)

Use this when you want one Claude session to power through your entire half of the split sequentially. Cheaper than subagents; slower but steadier.

**Person A prompt:**

```
I'm building the pre-deposit half of PicknBuild. Docs live at
docs/requirements/ARCHITECTURE.md and docs/requirements/COMPONENTS.md.
Contracts + fixtures are at src/contracts/. Service stubs are at src/services/.

My sections are Teams 1, 3, 4, 5, 6, 7, 11, 16:
- 1 Foundations (auth, onboarding, User record, global shell)
- 3 Supply / Data Plane (ingestion writer, listing store, link parser, VIN lookup)
- 4 Search Intake (top controls, IntakeState)
- 5 Four-Path Comparison (path cards, badges, sponsor boards)
- 6 Decision & Gap (Best Path Right Now, See Where You Stand, Buying Power)
- 7 Vehicle Detail
- 11 Pricing & Intelligence (credit-tier, picknbuild formula, Dealer APR,
  Recommendation, Pricing Guidance, Match Mode)
- 16 Feed

Read in order:
1. CLAUDE.md (repo root)
2. docs/requirements/ARCHITECTURE.md §2
3. docs/requirements/ARCHITECTURE.md §5 for each of my teams
4. docs/requirements/COMPONENTS.md rows I own + every row referenced in
   my "Talks to" lines
5. src/contracts/ and src/services/

Rules:
- Import every shared type from @/contracts. Never redefine.
- For anything outside my teams, import from @/services (the other half's
  stubs return fixtures — don't work around them).
- Do NOT modify src/contracts/ or another team's service signatures.
- Honor ARCHITECTURE §7 Dropped items. Stop and flag if required.
- Scrapers are black boxes.
- Build in §6 order: Team 1 → 3 → 11 → 4 → 5 → 6 → 7 → 16.
- Update TEAMS.md (claim → in progress → merged) as you go.

Start with Team 1 Foundations. Tell me when it's ready to merge before
moving on.
```

**Person B prompt:**

```
I'm building the post-selection + services half of PicknBuild. Docs live at
docs/requirements/ARCHITECTURE.md and docs/requirements/COMPONENTS.md.
Contracts + fixtures are at src/contracts/. Service stubs are at src/services/.

My sections are Teams 2, 8, 9, 10, 12, 13, 14, 15:
- 2 Profiles (Buyer, Dealer, Seller + Dealer Edit Panel)
- 8 Garage
- 9 Commit / Checkout (picknbuild Configurator, packages, Live Price Panel,
  Agreement, Signature, Deposit Checkout)
- 10 Post-Deposit Dashboard
- 12 Workflows Backend (two-step conversion state machine, Build Started
  workflow, dealer-lead + private-seller-invite flows)
- 13 Messaging + Notifications
- 14 Payments Backend (Stripe, subscriptions, refunds, payment tracking)
- 15 Admin + Integrity (Admin Dashboard, logging, data privacy, secure storage,
  sponsor catalog)

Read in order:
1. CLAUDE.md (repo root)
2. docs/requirements/ARCHITECTURE.md §2
3. docs/requirements/ARCHITECTURE.md §5 for each of my teams
4. docs/requirements/COMPONENTS.md rows I own + every row referenced in
   my "Talks to" lines
5. src/contracts/ and src/services/

Rules:
- Import every shared type from @/contracts. Never redefine.
- For anything outside my teams, import from @/services.
- Do NOT modify src/contracts/ or another team's service signatures.
- Honor ARCHITECTURE §7 Dropped items. Stop and flag if required.
- Auction path is DIY only — no platform-run bidding, no Auction Service.
- Build in §6 order: Team 15 secure storage → 14 → 12 → 13 → 2 → 9 → 10 → 8.
- Update TEAMS.md (claim → in progress → merged) as you go.

Start with Team 14 Stripe deposit sandbox (Team 9 and Team 12 both depend on it).
Tell me when it's ready to merge before moving on.
```

---

## 9. What NOT to touch without coordination

- **`src/contracts/`** — frozen after the Phase 0 commit. A contract change is a coordinated PR that lands before any consumer imports the new shape. If you think something is wrong, stop and message the other human.
- **Another team's service signature in `src/services/team-*.ts`** — you can replace the body of a stub you own, and add new functions if you need them, but don't rename or change the argument/return shape of a function another team imports.
- **`main` force-push or reset** — never. If you pushed bad history, revert via new commits, don't rewrite.
- **`package.json` major dep changes without the other human's sign-off** — upgrades that touch Next.js, React, Supabase, or Stripe affect every team.

---

## 10. Expected timeline

- **Day 1:** Phase 0 already done (this commit). Both humans claim Team 1 and Team 15's storage slice respectively.
- **Days 2–3:** Batches 2–3 land on both sides.
- **Days 4–5:** Batches 4–5 land.
- **Day 6:** Integration pass — run the app end-to-end, resolve the first round of shape mismatches, fix the three seams from §2 if any drifted.
- **Day 7:** Smoke tests, PR cleanup, first demo-able build.

If a batch slips, the slip compounds — the next batch can't start until its dependencies merge. Keep claimed work moving; if you're blocked, flag it and swap to an unblocked team instead of sitting.

---

## 11. Troubleshooting

- **Agent wants to edit `src/contracts/`:** stop the agent. The contract is frozen. If the field is actually missing, coordinate with the other human, land the contract change as a single PR, then resume.
- **Agent wants to implement a scraper:** stop. Scrapers are black boxes. Agent should consume `ListingObject` from `@/services/team-03-supply`.
- **Agent reintroduces a dropped item (reality check engine, What Matters Most, Katzkin, paid Auction Service, etc.):** stop. List is in ARCHITECTURE §7 and `docs/requirements/chud/DROPPED.md`.
- **Tests pass locally but fail in PR review:** both of you are on the same Next version (see AGENTS.md) — if CI diverges, it's usually a missing migration or env var, not a code problem.
- **Typecheck breaks after a merge:** re-run `./node_modules/.bin/tsc --noEmit`. If a contract type narrowed, the consumer needs to handle the narrower case. Don't widen the contract to fix the consumer.
- **Two agents edited the same file on different branches:** resolve normally. If you're *often* hitting this, your team split is too fine — talk to the other human about coarser ownership.
