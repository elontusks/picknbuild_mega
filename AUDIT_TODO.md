# PickNBuild Codebase Audit & TODO

**Date:** 2026-04-24
**Scope:** `/Users/athinshetty/Desktop/picknbuild/picknbuild_mega/` (all 16 teams merged)
**Method:** 7 parallel exploration agents (auth, supply, comparison, garage/checkout, backend services, admin/feed, routing/API surface)

---

## TL;DR — Production Readiness ≈ 40%

Code structure, contracts, routing, and auth gating are in good shape. **All 41 API routes exist**, **12 Supabase migrations applied**, **no broken `<Link>` paths**, **admin gated correctly**. The blockers are external integrations:

- Stripe credentials not set → deposits, refunds, subscriptions, webhooks all fail
- Email API not configured → notifications fall back to `console.warn`
- Realtime is in-memory only → multi-tab + multi-device messaging will not propagate
- Media uploads are base64 inline → no S3/Storage bucket wired
- VIN decoder + ZIP centroid tables are seeded fixtures (intentional v1)
- DealRequest (upgrade/downgrade/surrender) writes succeed but nothing consumes them

---

## 🔴 Critical — Production Blockers

### 1. Missing environment variables

`.env` currently contains only:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
FIRECRAWL_API_KEY
```

The following are **referenced in code but absent** from `.env`:

| Var | File / Line | Effect if missing |
|-----|-------------|-------------------|
| `STRIPE_SECRET_KEY` | `src/lib/payments/stripe-client.ts:279` | All Stripe calls throw — no deposits, no refunds, no subscriptions |
| `STRIPE_WEBHOOK_SECRET` | `src/app/api/payments/webhook/route.ts:7` | Webhook returns 400 — payment intents never reconcile |
| `STRIPE_PRICE_DEALER_BASIC` | `src/services/team-14-payments.ts:403` | Falls back to `"price_dealer_basic_stub"` → invalid Stripe subscription, silent failure |
| `EMAIL_API_URL` | `src/lib/messaging/email-client.ts:79` | Emails skipped, logged only |
| `EMAIL_API_KEY` | `src/lib/messaging/email-client.ts:80` | Same as above |
| `PICKNBUILD_WIRE_ROUTING` | `src/services/team-14-payments.ts:515` | Falls back to dummy `"123456789"` |
| `PICKNBUILD_WIRE_ACCOUNT` | `src/services/team-14-payments.ts:516` | Falls back to dummy `"000111222"` |
| `PICKNBUILD_WIRE_BANK` | `src/services/team-14-payments.ts:518` | Falls back to `"First National"` |

**TODO:**

- [ ] Add Stripe live + test keys, configure webhook endpoint in Stripe dashboard, copy webhook secret
- [ ] Create dealer-basic Price in Stripe and set `STRIPE_PRICE_DEALER_BASIC`
- [ ] Pick an email provider (Resend / Postmark / Mailgun — generic Bearer-auth JSON POST already wired in `email-client.ts`) and set `EMAIL_API_URL` + `EMAIL_API_KEY`
- [ ] Get real escrow account details and set the three `PICKNBUILD_WIRE_*` vars
- [ ] Decide whether `FIRECRAWL_API_KEY` (set but unused — `grep` finds no references) should be removed or wired into the link parser

### 2. Stripe webhook hardening

`src/app/api/payments/webhook/route.ts` ✓ verifies signature and ✓ tracks idempotency in `stripe_events` bucket, but:

- [ ] No dead-letter handling if `Workflows.onDepositReceived()` throws after the Stripe event is acked
- [ ] **No idempotency on refunds** — duplicate refund POSTs create duplicate `PaymentRecord` rows (`team-14-payments.ts`)
- [ ] Hardcoded test card `pm_card_visa` left in `src/components/payments/payment-processing-interface.tsx:25` — gate behind `NODE_ENV !== "production"`

### 3. Realtime transport not connected

`src/lib/messaging/realtime-client.ts:34–87` — the default export is an **in-memory pub-sub**. Comment says "browser variant will attach at process boundary." Multi-device messaging silently does not propagate.

- [ ] Replace in-memory client with Supabase Realtime channel (preferred — Supabase already on) or Socket.IO server
- [ ] Wire to `/api/threads/[id]` and `/api/notifications` endpoints so server-side mutations push events
- [ ] Add presence + typing indicators if needed for inbox UX

### 4. Media upload is base64-inline

`src/components/feed/media-upload.tsx:5–9` and `src/lib/feed/validate.ts:62` — feed posts persist images as `data:` URLs in jsonb. Hits Supabase row-size limits fast.

- [ ] Create Supabase Storage bucket (`feed-media`) with policies
- [ ] Replace base64 path with `supabase.storage.from(...).upload(...)`, store the public URL
- [ ] Server-side MIME + size validation (currently client-side only, 1.5 MB cap)
- [ ] Same fix for any future profile-avatar / dealer-page photo upload

---

## 🟠 High — Functional gaps

### 5. DealRequest workflow stalls

`src/app/dashboard/actions.ts:152–197` — `submitDealRequest()` writes upgrade / downgrade / surrender requests to `deal_requests` bucket. **Nothing reads them.** No Team 12 workflow consumer, no admin queue, no notification fan-out. Customers will submit requests that vanish.

- [ ] Add admin page `/admin/deal-requests` listing pending requests
- [ ] Add Team 12 workflow handler that on approval mutates DealRecord state + fires notification
- [ ] Add "submitted" → "in review" → "resolved" status transitions

### 6. Garage save not surfaced in pre-deposit funnel

Team 7 (Vehicle Detail) `available-actions-bar.tsx` and Team 5 path cards have **no "Save to garage" button**. The `/garage` page works in isolation; users can only add vehicles by direct API call.

- [ ] Add Save button to `AvailableActionsBar` and each path card → POST `/api/garage`
- [ ] Toast confirmation + optimistic state update

### 7. Comments do not notify

`src/lib/listings/comments.ts` writes comments via Team 15 storage but **does not** dispatch a Team 13 notification to the original poster or thread participants. (Feed comments do — `team-16-feed.ts:266–277` — listing comments do not.)

- [ ] Mirror feed-comment fan-out: on new comment, call `Notifications.send({ category: "comment", ... })`
- [ ] Add "comment" to default notification preferences (currently absent — see #10)

### 8. Inspection store is in-memory

`src/services/team-11-intelligence.ts:62–82` — `INSPECTION_STORE` is a `Map`. Resets on every deploy.

- [ ] Persist to Team 15 `inspections` bucket
- [ ] Add an external partner integration point (placeholder webhook + signed callback) so a real inspector can flip status from `pending` → `complete`
- [ ] On `complete`, trigger Team 12 deal-status advance + Team 13 notification to buyer

### 9. PDF + signature stubs in checkout

- `src/app/checkout/actions.ts:178` — `pdfUrl: "pending://agreement/{userId}"` — agreement PDF never rendered
- `src/components/checkout/signature-capture.tsx` — typed-text SVG, not a real canvas signature

**TODO:**

- [ ] Wire a PDF generator (Puppeteer / pdf-lib / Stirling-PDF microservice) and upload to Storage
- [ ] Replace SignatureCapture with canvas-based component or DocuSign / HelloSign / Dropbox Sign embed
- [ ] If using a 3rd-party signature service, add `DOCUSIGN_*` env vars + webhook for completion

### 10. Notification preferences missing categories

`src/services/team-13-notifications.ts:59–66` lists 6 default categories but **omits `"payment"` and `"comment"`**, even though emit sites use them. Users cannot opt out of payment notifications because there is no preference key for them.

- [ ] Add `"payment"`, `"comment"`, `"deal-status"` to the default preferences array
- [ ] Migration to backfill existing users

### 11. Digest cron not scheduled

`src/services/team-13-notifications.ts` has digest assembly logic but no scheduler. `/api/notifications/digest` exists but nothing invokes it.

- [ ] Add Supabase scheduled function (or external cron) that hits `/api/notifications/digest` daily
- [ ] Decide cadence (daily 8 AM local? weekly Mondays?)

### 12. Feed pagination missing

`src/services/team-16-feed.ts:65–76` — `listFeedPosts()` reads the entire `feed_posts_index` into memory.

- [ ] Cursor-based pagination on `feed_posts_index` (created_at DESC + opaque cursor)
- [ ] Default page size 20, infinite scroll on `/feed`

---

## 🟡 Medium — Integrations & polish

### 13. Missing webhooks

| Webhook | Why needed | Status |
|---------|------------|--------|
| Twilio inbound | SMS replies (signup phone verify, deal status alerts) | not built |
| Supabase Auth events | Audit log, custom triggers | not built |
| Scraper ingestion | Copart / IAAI bulk update push | not built — assumed polling |
| Inspection partner | External inspector status callback | not built (see #8) |
| DocuSign / signature | Agreement signed callback | not built (see #9) |

- [ ] Decide which are needed for v1 vs deferred

### 14. SMS notifications absent

Team 13 wires email but not SMS. Phone-verified users could get critical alerts via SMS.

- [ ] Add Twilio client in `src/lib/messaging/sms-client.ts`
- [ ] Add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` env
- [ ] Route `notification.channel === "sms"` through it

### 15. Push notifications absent

No APNs / FCM integration; mobile users only get email.

- [ ] Decide whether v1 needs push (probably defer if web-only)
- [ ] If needed: web-push via VAPID keys, or Expo push if a mobile app is planned

### 16. VIN decoder is a 19-row table

`src/lib/listings/vin-lookup.ts:30–49` — covers Honda / Tesla / Ford / Toyota / BMW / Audi / Subaru / Chevrolet / Nissan WMIs only; year codes 2010–2030 only.

- [ ] Wire NHTSA vPIC API (free, no key) for full coverage — `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/{vin}?format=json`
- [ ] Or Carfax / DataOne for richer fields (paid)

### 17. ZIP distance has 15 entries

`src/lib/geo/zip-distance.ts:24–40` — 15 metros only. Distance Display silently degrades to `"— mi"` for unknown ZIPs.

- [ ] Import full US ZIP centroid CSV (free from USPS / GeoNames) into a `zip_centroids` table
- [ ] Or call a geocoding API (Google Maps, Mapbox) — add `GOOGLE_MAPS_API_KEY` if so

### 18. No observability

No Sentry / Datadog / OpenTelemetry. Errors silent unless they hit `admin_logs`.

- [ ] Add Sentry (`@sentry/nextjs`) — `SENTRY_DSN` env
- [ ] Optionally Datadog RUM for frontend perf
- [ ] Wire to `logEvent()` so admin dashboard surface stays consistent

### 19. No content moderation

Feed posts + media accepted as-is. No profanity / NSFW / spam check.

- [ ] Decide policy — Perspective API, AWS Rekognition for images, or human-only via admin queue
- [ ] If automated: env keys + pre-publish hook in `team-16-feed.ts`

### 20. Hardcoded Sponsor blocks have XSS risk

`src/app/admin/actions.ts:229` — sponsor catalog uses `dangerouslySetInnerHTML`. Admin-only input, but still:

- [ ] Sanitize via DOMPurify before render
- [ ] Or switch to a safe template format (markdown + allowed-tag whitelist)

### 21. `nextFixtureId("pay")` in production path

`src/services/team-14-payments.ts:183` — payment IDs use a fixture-style ID generator, not `crypto.randomUUID()`. Risk of collisions at scale.

- [ ] Replace with `crypto.randomUUID()` or Stripe payment-intent ID

### 22. Subscription model assumes one-per-user

`src/services/team-14-payments.ts` — `SUBSCRIPTIONS_BUCKET` keyed by `userId`, so a dealer cannot hold both a basic subscription and (future) lead-pack add-on.

- [ ] If multi-plan is on the roadmap, switch key to `${userId}:${planId}` and track active plans as a list

---

## 🟢 Low — Cleanup / hygiene

### 23. Unused dependency: Firecrawl

`FIRECRAWL_API_KEY` is in `.env` but no code imports it. Remove or actually use for link parser.

- [ ] Decide and either delete or wire into `src/lib/listings/link-parser.ts`

### 24. Sponsor empty-state

`src/components/compare/sponsor-board.tsx:49` — returns `null` silently when no sponsors are set.

- [ ] Replace with operator-curated fallback or a "Sponsorships available" CTA

### 25. Schema-versioning on secure_records

`secure_records` jsonb is type-safe at the TS layer but has no schema version field. Future contract changes will need migrations.

- [ ] Add `schema_version` to every bucket payload + helper to upcast on read

### 26. Defensive dedupe on `appendToList`

Several read paths call `Array.from(new Set(ids))` to dedupe. The atomic `appendToList` RPC could itself dedupe.

- [ ] Add `unique` flag to `secure_records_append_to_list` RPC + drop the post-read dedupe

### 27. Force-dynamic on admin layout

`src/app/admin/layout.tsx` sets `force-dynamic` globally — correct for safety but means admin pages never cache. Acceptable for now; revisit if perf complaints.

---

## ✅ What's actually solid (don't re-audit)

- **Team 1 / 2 (Auth + Profiles):** Routes wired, guards in place, Supabase RLS migrated. Production-ready.
- **Team 3 / 4 (Supply + Search Intake):** All 6 listings API routes, all dynamic routes, link parser + VIN lookup with documented v1 fallbacks. Architecture-correct.
- **Team 5 / 6 / 7 (Comparison / Decision / Detail):** All path cards, decision panels, vehicle detail wired. Conversion state machine integrated.
- **Team 8 / 9 / 10 (Garage / Checkout / Dashboard):** Routing complete, Stripe integration code complete (just needs keys), wire instructions return values (just need real account).
- **Team 11–14 backend services:** Pricing formulas real, conversion state machine real, payments + subscriptions real. Gaps are at integration boundaries, not core logic.
- **Team 15 / 16 (Admin + Feed):** Admin protection correct, sponsor catalog real, feed engagement real. Storage RPCs (`appendToList`, `compareAndSetRecord`) are idempotent and race-safe.
- **Database:** 12 migrations applied, contracts match schema, RLS configured.
- **Routing:** All 41 API routes exist + match every `fetch()` call. No orphan routes, no orphan fetches, no dead `<Link>` hrefs.

---

## Suggested execution order

1. **Set the missing env vars** (#1) — unblocks Stripe + email immediately.
2. **Stripe webhook hardening** (#2) — required before accepting real money.
3. **Storage bucket for media** (#4) — easy win, prevents row-size blowups.
4. **DealRequest consumer** (#5) — currently a silent black hole for paying customers.
5. **Realtime transport** (#3) — biggest UX gap once people start using messaging.
6. **Garage save UX** (#6) and **comment notifications** (#7) — small, high-value polish.
7. **Inspection persistence** (#8) and **PDF/signature** (#9) — needed before launch but can stub through soft-launch.
8. **Notification prefs + digest cron** (#10, #11) and **feed pagination** (#12).
9. Everything else (medium/low) as scale + scope demands.

---

*Generated by 7 parallel exploration agents auditing each team slice. Cross-references in-line. Re-run with the same prompts to verify drift.*
