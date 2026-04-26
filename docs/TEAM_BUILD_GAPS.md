# TEAM BUILD GAPS — PENDING WORK FOR AGENT TEAMS

**Date:** April 26, 2026  
**Status:** All 16 teams have merged. This document lists incomplete deliverables per team.

Each team owns specific components and services. This doc maps what each team was supposed to deliver vs. what's still pending.

---

## TEAM 1: Foundations (Auth, Onboarding, User, Shell)
**Owner:** athin shetty | **Status:** merged  
**Merge Priority:** 1

### ✅ Delivered
- Phone-verified signup flow
- Onboarding wizard (location, budget, credit inputs)
- User record creation
- Global shell + responsive layout
- Mobile nav

### ⏳ Pending
- None identified. **READY FOR PRODUCTION.**

---

## TEAM 2: Profiles (Buyer/Dealer/Seller + Dealer Edit Panel)
**Owner:** amogh kuppa | **Status:** merged  
**Merge Priority:** 8

### ✅ Delivered
- Buyer profile view
- Dealer profile view + edit panel
- Seller listing management
- Profile ownership + RLS guards

### ⏳ Pending
- **Profile edit mode after onboarding** (users can't update credit score) — LOW priority
- Dealer page media upload hardening
- Profile avatar upload to Storage (currently base64 only)

---

## TEAM 3: Supply / Data Plane (Listing Store, Link Parser, VIN)
**Owner:** athin shetty | **Status:** merged  
**Merge Priority:** 2

### ✅ Delivered
- Listing ingestion pipeline
- Link parser (Copart, IAAI, Craigslist, dealer URLs)
- VIN lookup (19-row hardcoded table — documented as v1 fallback)
- On-view refresh with cooldowns
- Idle sweep job (function exists)

### ⏳ Pending
- **Idle sweep job not scheduled** — function exists in code but never called on cron. Stale listings accumulate. HIGH priority.
- **VIN decoder expansion** — wire NHTSA vPIC API (free) to cover all makes. MEDIUM priority.
- **ZIP distance table expansion** — currently 15 metros only. Import full US ZIP centroids. MEDIUM priority.

---

## TEAM 4: Search Intake (Top Controls, Credit Input, Match Mode, Link Parser)
**Owner:** athin shetty | **Status:** merged  
**Merge Priority:** 9

### ✅ Delivered
- Top controls bar (location, budget, credit, clean/rebuilt toggle)
- IntakeState store (all searches persist to User record)
- Link parser input ("Already Found a Car?")
- Match Mode toggle

### ⏳ Pending
- **Match Mode filtering not tested/verified** — toggle exists, search endpoint exists, integration untested. HIGH priority.
- Garage filters not persistent (reset when leaving `/garage`)

---

## TEAM 5: Four-Path Comparison (Path Cards, Row Display, Badges)
**Owner:** athin shetty | **Status:** merged  
**Merge Priority:** 10

### ✅ Delivered
- Four path cards (Dealer, Auction, PicknBuild, Private)
- Title + risk + best-fit badges
- Sponsor boards (when available)

### ⏳ Pending
- **"Save to Garage" button missing from path cards** — API endpoint exists but no UI button in search flow. Users can't bookmark vehicles. HIGH priority.

---

## TEAM 6: Decision & Gap (Best Path, See Where You Stand, Choose Term)
**Owner:** athin shetty | **Status:** merged  
**Merge Priority:** 11

### ✅ Delivered
- "Your Best Path Right Now" panel
- "See Where You Stand" gap visualization
- "Choose Your Term" selector
- Per-path gap modules

### ⏳ Pending
- None identified. **READY FOR PRODUCTION.**

---

## TEAM 7: Vehicle Detail (Detail View, All-Paths, Actions Bar, Comments)
**Owner:** athin shetty | **Status:** merged  
**Merge Priority:** 12

### ✅ Delivered
- Vehicle detail page
- All-paths display
- Available actions bar
- Comments + replies (storage layer)

### ⏳ Pending
- **Listing comments don't trigger notifications** — comment writes succeed but original poster never notified. Feed comments work (reference pattern exists). HIGH priority.
- Comment notification preference missing from defaults

---

## TEAM 8: Garage (Container, Grouping, Comparison Table, Actions, Filters)
**Owner:** amogh kuppa | **Status:** merged  
**Merge Priority:** 13

### ✅ Delivered
- Garage container page
- Grouping by YMM
- Comparison table
- Filters + sorting
- Garage item card

### ⏳ Pending
- **"Save to Garage" button not surfaced in search** — users can't reach garage from pre-deposit flow. HIGH priority (Team 5/7 issue, blocks Team 8 usage).
- Filter state not persistent across sessions

---

## TEAM 9: Commit / Checkout (Configurator, Packages, Live Price, Customizations, Agreement, Signature, Deposit)
**Owner:** amogh kuppa | **Status:** merged  
**Merge Priority:** 14

### ✅ Delivered
- Configurator page (wrap, seats, starlight, paint toggles)
- Package selection
- Live price panel (updates on customization)
- Agreement form
- Deposit flow (Stripe integration complete)

### ⏳ Pending
- **PDF agreement is stub** — `pdfUrl: "pending://..."` never rendered. Users have no proof of what they signed. CRITICAL for production money. ~6–8h.
- **Signature capture is typed text, not canvas** — not legally defensible. Needs canvas or DocuSign. CRITICAL. ~4–6h.
- Configurator entry point validation (no check for existing build records)
- Post-deposit pending state (routes immediately instead of showing "processing...")

---

## TEAM 10: Post-Deposit Dashboard (Status Timeline, Payment History, Wire Instructions, Upgrade/Downgrade/Surrender)
**Owner:** amogh kuppa | **Status:** merged  
**Merge Priority:** 15

### ✅ Delivered
- Customer dashboard layout
- Status timeline
- Payment history display
- Wire instructions display
- Upgrade/downgrade/surrender request buttons

### ⏳ Pending
- **Deal requests have no consumer** — upgrade/downgrade/surrender buttons submit requests but nothing processes them. No admin queue, no workflow. CRITICAL. ~8–12h.
- No `/admin/deal-requests` page
- Deal request status page (customer can't see if request approved/denied)

---

## TEAM 11: Pricing & Intelligence Backend (Credit-Tier, Pricing Formula, Dealer APR, Trade-In, Recommendation)
**Owner:** athin shetty | **Status:** merged  
**Merge Priority:** 3

### ✅ Delivered
- Credit tier resolver
- PicknBuild formula (wrap + seats + starlight + paint pricing)
- Dealer APR logic
- Trade-in value estimation
- Pricing guidance display

### ⏳ Pending
- **Inspection store is in-memory only** — `Map` resets on every deploy. User requests inspection, status lost on redeploy. CRITICAL. ~4–6h.
- Inspection partner integration (webhook placeholder missing)

---

## TEAM 12: Workflows Backend (State Machine, Deal Status Advancement, Dealer Leads, Private Seller Invites)
**Owner:** amogh kuppa | **Status:** merged  
**Merge Priority:** 4

### ✅ Delivered
- Two-step conversion state machine (pre-deposit, post-deposit)
- Deal status transitions
- Dealer-lead signal flow
- Private-seller-invite flow

### ⏳ Pending
- **Deal request consumer missing** — no workflow triggered by Team 10's upgrade/downgrade/surrender requests. CRITICAL. ~8–12h.
- **Inspection lifecycle not wired** — inspection completion doesn't trigger deal advance or notification. HIGH. ~4–6h.
- Inspection workflow integration (Team 11 inspection → Team 12 state advance → Team 13 notification)

---

## TEAM 13: Messaging + Notifications (Socket Transport, Inbox, Threads, Notifications, Bell, Toasts, Preferences, Digest)
**Owner:** amogh kuppa | **Status:** merged  
**Merge Priority:** 5

### ✅ Delivered
- Socket transport layer (Supabase Realtime framework in place)
- Inbox + threads UI
- Three chat kinds (dealer, seller, support)
- Notification service
- Bell icon + toast UI
- Notification preferences UI

### ⏳ Pending
- **Realtime messaging not wired** — in-memory pub-sub only. Multi-device messaging doesn't propagate. Users open inbox on phone, type on desktop, message never arrives. CRITICAL. ~6–8h (or 2–3h if polling fallback acceptable).
- **Listing comment notifications missing** — comments write but don't notify. HIGH. ~1–2h.
- **Email digest scheduler not wired** — digest assembly logic exists but nothing calls it. HIGH. ~1–2h.
- **Notification preferences missing categories** — "comment" and "payment" emit but have no preference keys. Users can't opt out. HIGH. ~30m.

---

## TEAM 14: Payments Backend (Stripe Charges, Refunds, Subscriptions, Webhook Reconciliation, Wire Instructions)
**Owner:** amogh kuppa | **Status:** merged  
**Merge Priority:** 6

### ✅ Delivered
- Stripe client (payment intents, refunds, subscriptions)
- Webhook signature verification + idempotency tracking
- Subscription lifecycle
- Wire instructions generation
- Dealer lead unlock + per-listing fee logic
- Payment tracking

### ⏳ Pending
- **Missing Stripe webhook dead-letter handling** — customer charged but DealRecord creation fails → silent failure. No recovery queue, no admin alert. CRITICAL. ~4–6h.
- **No refund idempotency** — duplicate refund POSTs create duplicate records. CRITICAL. ~2–3h.
- **Hardcoded test card in production path** — `pm_card_visa` fallback in payment component. CRITICAL. ~15m.
- Environment variables missing (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_DEALER_BASIC, wire account details) — already set but initially missing
- Refund request lifecycle (RPC exists, nothing consumes it)

---

## TEAM 15: Admin + Integrity (Dashboard, Logging, Secure Storage, Sponsor Catalog, Data Privacy)
**Owner:** amogh kuppa | **Status:** merged  
**Merge Priority:** 7

### ✅ Delivered
- Admin dashboard (user/listing/deal views)
- Event logging
- Secure storage layer (Team 15 RPCs: `putRecord`, `appendToList`, `compareAndSetRecord`)
- Sponsor catalog management
- Data privacy controls

### ⏳ Pending
- **No observability** — no Sentry/DataDog. Errors only surface via manual admin_logs check. MEDIUM. ~2–4h.
- **No content moderation** — feed posts/images accepted as-is. No spam/NSFW checks. MEDIUM. ~4–6h.
- **Missing `/admin/deal-requests` page** — requests write to DB but admin has no UI to see/approve them. HIGH. (Team 10/12 issue)
- **Missing `/admin/dead-letters` page** — webhook failures have nowhere to surface. CRITICAL. (Team 14 issue)
- XSS risk in sponsor catalog (`dangerouslySetInnerHTML`) — admin-only but should sanitize. LOW. ~1h.
- Schema versioning missing on secure_records — future contract changes need migrations. LOW. ~1–2h.

---

## TEAM 16: Feed (Surface, Templates, Engagement, Upload, Vehicle Card in Feed, Clustering)
**Owner:** amogh kuppa | **Status:** merged  
**Merge Priority:** 16

### ✅ Delivered
- Feed surface `/feed`
- Post templates (dealer, seller, platform)
- Engagement controls (like, reply)
- Media upload
- Vehicle card display in feed
- Clustering stub

### ⏳ Pending
- **Feed pagination missing** — `listFeedPosts()` reads entire index into memory. At 10k posts = slow. MEDIUM. ~2–3h.
- **Media upload base64 inline** — images stored as `data:` URLs in jsonb. Row-size blowup risk at 3+ large images. MEDIUM. ~2–3h.
- Feed clustering ranking not verified (posts may be chronological, not ranked)
- Sponsor empty-state (returns `null` silently) — LOW. ~1h.

---

## PRIORITY MATRIX

### 🔴 CRITICAL (Block Launch)

| # | Team | Item | Effort | Impact |
|----|------|------|--------|--------|
| 1 | 14 | Stripe webhook dead-letter | 4–6h | Customer charged but no order created |
| 2 | 14 | Refund idempotency | 2–3h | Duplicate refunds on retry |
| 3 | 14 | Remove test card hardcode | 15m | Security/consistency |
| 4 | 13 | Realtime messaging | 6–8h | Multi-device messaging fails |
| 5 | 10/12 | Deal request consumer | 8–12h | Upgrade requests vanish |
| 6 | 9 | PDF agreement | 6–8h | Legal liability |
| 7 | 9 | Signature capture | 4–6h | Legal defensibility |

**Total: ~31–43 hours**

### 🟡 HIGH (Week 1 Post-Launch)

| # | Team | Item | Effort |
|----|------|------|--------|
| 8 | 5/7/8 | Save to Garage button | 2–4h |
| 9 | 7/13 | Listing comment notifications | 1–2h |
| 10 | 13 | Notification preferences | 30m |
| 11 | 3 | Idle sweep job scheduling | 2h |
| 12 | 11/12 | Inspection persistence | 4–6h |
| 13 | 13 | Email digest scheduler | 1–2h |

**Total: ~10–17 hours**

### 🟠 MEDIUM (Month 1)

| # | Team | Item | Effort |
|----|------|------|--------|
| 14 | 13 | Realtime fallback (polling) | 2–3h |
| 15 | 4 | Match Mode integration test | 1–2h |
| 16 | 16 | Feed pagination | 2–3h |
| 17 | 16 | Media upload to Storage | 2–3h |
| 18 | 15 | Observability/Sentry | 2–4h |
| 19 | 15 | Content moderation | 4–6h |
| 20 | 3 | VIN decoder expansion | 1–2h |
| 21 | 3 | ZIP distance expansion | 2–3h |

**Total: ~19–31 hours**

### 🟢 LOW (Nice-to-Have)

| # | Team | Item | Effort |
|----|------|------|--------|
| 22 | 2 | Profile edit mode | 2h |
| 23 | 9 | Configurator validation | 1h |
| 24 | 15 | XSS hardening | 1h |
| 25 | 15 | Schema versioning | 1–2h |

---

## EXECUTION ROADMAP

### PHASE 1: CRITICAL (Before Launch, ~40 hours)
1. Team 14: Webhook dead-letter + refund idempotency + remove test card (6–9h)
2. Team 13: Realtime messaging OR polling fallback (6–8h)
3. Team 10/12: Deal request consumer (8–12h)
4. Team 9: PDF + signature (10–14h)
5. Team 5/7/8: Save to Garage (2–4h)

### PHASE 2: HIGH-IMPACT (Week 1, ~15 hours)
6. Team 7/13: Listing comment notifications (1–2h)
7. Team 13: Notification preferences + digest scheduler (1.5–3.5h)
8. Team 3: Idle sweep job (2h)
9. Team 11/12: Inspection persistence (4–6h)

### PHASE 3: OPERATIONAL (Month 1, ~25 hours)
10. Team 16: Feed pagination + media upload (4–6h)
11. Team 15: Observability + content moderation (6–10h)
12. Team 3: VIN + ZIP expansions (3–5h)
13. Team 4: Match Mode testing (1–2h)

### PHASE 4: NICE-TO-HAVE (Defer)
14. Polish, security hardening, profile edit mode, etc.

---

## Summary by Team

| Team | Status | Gaps | Priority |
|------|--------|------|----------|
| 1 | ✅ Complete | None | N/A |
| 2 | ✅ Complete | Profile edit mode (LOW) | LOW |
| 3 | 🟡 Partial | Idle sweep (HIGH), VIN/ZIP (MEDIUM) | HIGH |
| 4 | 🟡 Partial | Match Mode testing (MEDIUM) | MEDIUM |
| 5 | 🟡 Partial | Save button (HIGH) | HIGH |
| 6 | ✅ Complete | None | N/A |
| 7 | 🟡 Partial | Save button (HIGH), comment notifications (HIGH) | HIGH |
| 8 | 🟡 Partial | Save button (HIGH) | HIGH |
| 9 | 🔴 Critical | PDF (CRITICAL), Signature (CRITICAL), validation (LOW) | CRITICAL |
| 10 | 🔴 Critical | Deal requests (CRITICAL) | CRITICAL |
| 11 | 🟡 Partial | Inspection (HIGH) | HIGH |
| 12 | 🔴 Critical | Deal request consumer (CRITICAL), inspection (HIGH) | CRITICAL |
| 13 | 🔴 Critical | Realtime (CRITICAL), comments (HIGH), digest (HIGH), prefs (HIGH) | CRITICAL |
| 14 | 🔴 Critical | Webhook DLQ (CRITICAL), refund (CRITICAL), test card (CRITICAL) | CRITICAL |
| 15 | 🟠 Medium | Observability (MEDIUM), moderation (MEDIUM), admin pages (HIGH) | MEDIUM |
| 16 | 🟠 Medium | Pagination (MEDIUM), media upload (MEDIUM) | MEDIUM |

**Teams Ready to Ship:** 1, 6  
**Teams with Minor Gaps:** 2, 4, 5, 7, 8, 11, 15, 16  
**Teams with Critical Gaps:** 9, 10, 12, 13, 14  

---

**Next Step:** Pick a Phase 1 item and spin up an agent to fix it.
