# Backend service stubs

Every service listed in `docs/requirements/ARCHITECTURE.md` §6 is stubbed here as a typed function returning fixture data. Each team replaces the stubs it owns with real implementations (calling Supabase, Stripe, etc.). Consumers import these exact function signatures from day one so the shape of every call is stable across the build.

Files are named `team-NN-<area>.ts` so an agent can find their team's service surface in one look. The owning team per ARCHITECTURE.md §5:

- `team-01-auth.ts` — Team 1 (loadSession, getCurrentUser, requireUser gate, phone-OTP signup, onboarding write, sign-out)
- `team-03-supply.ts` — Team 3 (listing store, link parser, VIN lookup, refresh, idle sweep, user/dealer uploads)
- `team-11-pricing.ts` — Team 11 (credit-tier, picknbuild total-price, bi-weekly, term-to-cadence, Dealer APR, trade-in, already-have-a-car)
- `team-11-intelligence.ts` — Team 11 (recommendation, pricing guidance, inspection routing, match mode, checklist)
- `team-12-workflows.ts` — Team 12 (conversion state machine, Build Started workflow, dealer-lead + private-seller-invite flows)
- `team-13-messaging.ts` — Team 13 (threads, messages, socket transport)
- `team-13-notifications.ts` — Team 13 (notification service, preferences, bell feed, email digest)
- `team-14-payments.ts` — Team 14 (Stripe charge/refund/subscription, payment tracking, wire instructions)
- `team-15-storage.ts` — Team 15 (secure storage layer abstraction, sponsor catalog)

Every stub is called via its typed function signature. Do not redefine the shape at the call site. If a shape is wrong, fix `src/contracts/` (coordinated — see root `CLAUDE.md`).
