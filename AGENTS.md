<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# You're running in a worktree

Every team is built inside its own git worktree at `../pnb-team-N/` (sibling to the parent `picknbuild_mega/` checkout). Your CWD is that worktree — it's already on branch `team-N/<slug>`. The parent checkout stays on `main` and is reserved for coordination (pulling, `TEAMS.md` edits, PR reviews) — **don't `cd` up and commit there**.

- Dev server: `PORT=30NN npm run dev` (3001 for Team 1, 3007 for Team 7, 3016 for Team 16). Port 3000 stays free on the parent checkout.
- Tests + typecheck run the same way everywhere: `npx vitest run`, `npx tsc --noEmit`.
- `node_modules/` is per-worktree. Don't touch dependency files unless your charter requires it, and never add packages without coordinating with the other human.
- Supabase is **shared** across every worktree. Don't run `supabase db push` without flagging it in `TEAMS.md` first.
- When your PR merges, the claim/retire ritual happens in the parent checkout, not here. Full protocol: `TEAMS.md` and `docs/BUILD_PLAN.md` §5–§6.
