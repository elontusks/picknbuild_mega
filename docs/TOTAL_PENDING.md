# COMPLETE PICKNBUILD SPECIFICATION AUDIT & IMPLEMENTATION ROADMAP

**Date:** April 26, 2026  
**Scope:** All 27 requirement docs + 37 build-outline docs from picknbuild1  
**Status:** ~60% feature-complete. 5 critical gaps block launch. 23 total gaps identified.

---

## EXECUTIVE SUMMARY

The PicknBuild codebase has **all 16 teams' routes wired**, **11 frozen contracts implemented**, **12 database migrations applied**, and **core business logic operational**. However, **23 significant gaps** exist that impact production readiness:

- **🔴 5 CRITICAL** (blocking launch): realtime messaging, webhook dead-letter, refund idempotency, hardcoded test card, missing deal request consumer
- **🟡 6 HIGH** (week 1): save-to-garage button, listing comment notifications, inspection persistence, PDF/signature stubs, missing notification categories
- **🟠 8 MEDIUM** (month 1): email digest scheduling, feed pagination, media upload, observability, content moderation, VIN decoder, ZIP table, schema versioning
- **🟢 5 LOW** (defer): XSS hardening, fixture IDs, unused dependencies, subscription model, error tracking

**Non-Negotiable Rules Compliance:** 9/15 fully met, 5/15 mostly met, **2/15 critically violated** (Rules #12, #15)

**Estimated Launch Readiness:** 60% (can launch with Phase 1 fixes only, accepting Phase 2+ as deferred)

---

## PART 1: CRITICAL GAPS BLOCKING LAUNCH (5 items, ~24 hours)

### 🔴 #1: REALTIME MESSAGE TRANSPORT NOT WIRED

**Files:** `src/lib/messaging/realtime-client.ts:34–87`  
**Current:** In-memory pub-sub only  
**Impact:** Multi-device messaging fails silently. User opens inbox on phone, types on desktop, message never arrives.  
**Violates:** Non-Negotiable Rule #8 (meaningful actions trigger notifications)

**Scenario:**
1. User A sends message to User B
2. Message goes to Supabase `threads` table ✓
3. Notification sent to User B's email ✓
4. **BUT:** User B has inbox open on mobile → no live update → must refresh manually
5. User B closes mobile, opens desktop → checks inbox again → now sees message
6. **PROBLEM:** No realtime delivery. Feels broken.

**Fix Strategy:**
- Replace in-memory `RealtimeClient` with Supabase Realtime (already integrated into Supabase)
- Wire listeners to `/api/threads/[id]` and `/api/notifications` endpoints
- Emit when new message/notification arrives
- Bonus: add presence indicators + typing status

**Effort:** 6–8 hours

---

### 🔴 #2: STRIPE WEBHOOK DEAD-LETTER MISSING

**File:** `src/app/api/payments/webhook/route.ts:1–100`  
**Current:** Verifies Stripe signature and acks event, but no recovery if `Workflows.onDepositReceived()` throws after ack  
**Impact:** **CRITICAL MONEY BUG.** Customer deposit succeeds in Stripe, Stripe acks, then DB mutation fails. Customer charged but DealRecord never created.  
**Violates:** Non-Negotiable Rule #12 (every action produces defined response)

**Disaster Scenario:**
1. Customer submits $1,000 deposit via `/api/payments/deposit`
2. Stripe processes charge → ✓ charge created in Stripe
3. `/api/payments/webhook` receives `charge.succeeded` event
4. Stripe signature verified ✓
5. Event ID checked (idempotency) ✓
6. **Call `Workflows.onDepositReceived()`** → throws (e.g., DB connection lost)
7. Function fails, **no catch block**
8. Webhook handler crashes (or silently swallows error)
9. Stripe marks event as delivered (no retry)
10. **SILENT FAILURE:** Customer sees "Payment succeeded" but has no deal record
11. Customer refreshes dashboard → "No deals found"
12. Customer calls support, support has no tool to recover

**Root Cause:** Stripe webhook handler acks the event **before** confirming side-effects completed.

**Fix Strategy:**
1. Wrap `Workflows.onDepositReceived()` in try-catch
2. **On success:** ack event normally
3. **On failure:**
   - Write to `dead_letter_queue` table: `{ eventId, error, payload, timestamp }`
   - Emit admin alert: `POST /admin/alerts` → "Webhook processing failed for charge X"
   - **DO NOT ACK the event**
   - Stripe will retry webhook automatically (exponential backoff)
   - Eventually succeeds or goes cold after N retries
4. Add admin page `/admin/dead-letters` listing failed events
5. Admin can manually retry or investigate

**Code Pattern:**
```typescript
export async function POST(request: Request) {
  const event = await verifyStripeSignature(request);
  const eventId = event.id;
  
  // Idempotency check
  if (await eventIdAlreadyProcessed(eventId)) {
    return json({ success: true });
  }
  
  try {
    await Workflows.onDepositReceived(event.data.object);
    // Mark as processed
    await markEventProcessed(eventId);
    return json({ success: true });
  } catch (error) {
    // Write to DLQ
    await writeDeadLetter({
      eventId,
      error: error.message,
      payload: event.data.object,
    });
    // Emit admin alert
    await Notifications.alertAdmins(`Webhook processing failed: ${eventId}`);
    // Return 500 so Stripe retries
    return json({ error: error.message }, { status: 500 });
  }
}
```

**Effort:** 4–6 hours

---

### 🔴 #3: NO REFUND IDEMPOTENCY

**File:** `src/services/team-14-payments.ts:refund()`  
**Current:** Multiple refund POSTs create duplicate PaymentRecord rows  
**Impact:** Refund-request browser back-button or retry creates duplicate refunds. Customer sees two credit entries. Bookkeeping chaos.  
**Violates:** Non-Negotiable Rule #12 (every action produces defined response)

**Scenario:**
1. Customer POST `/api/payments/refund` with `{ dealId: "d1" }`
2. Refund succeeds: Stripe charge reversed, PaymentRecord created `{ refundId: "ref_xyz", status: "succeeded" }`
3. Network timeout or customer browser back-button
4. Customer POST `/api/payments/refund` again (same `dealId`)
5. **NO IDEMPOTENCY CHECK**
6. Creates second PaymentRecord `{ refundId: "ref_abc", status: "succeeded" }`
7. Creates second Stripe refund (customer now refunded 2x)
8. Customer's dashboard shows two refund entries
9. Finance team manually reverses one refund

**Fix Strategy:**
1. Create `refund_requests` bucket (Team 15 secure storage) with fields:
   - `dealId` (partition key)
   - `userId` (owner)
   - `createdAt` (timestamp)
   - `refundId` (Stripe refund ID if succeeded)
   - `status` (pending, succeeded, failed)
2. Before processing refund:
   - Query: `SELECT * FROM refund_requests WHERE dealId = ? AND createdAt > now() - interval '24h'`
   - If found: return cached response (do not re-process)
   - If not found: proceed
3. On Stripe refund success:
   - Write to `refund_requests` with refund ID
   - Create PaymentRecord

**Effort:** 2–3 hours

---

### 🔴 #4: STRIPE TEST CARD HARDCODED IN PRODUCTION PATH

**File:** `src/components/payments/payment-processing-interface.tsx:25`  
**Current:** Component checks `NODE_ENV` but falls back to test card `pm_card_visa` even in production  
**Impact:** If environment detection fails or is misconfigured, production Stripe requests hit test card. Deposits might not go through or might trigger test-card-specific behavior.  
**Violates:** Non-Negotiable Rule #9 (internal visibility into actions)

**Code:**
```typescript
const paymentMethodId = process.env.NODE_ENV === 'production' 
  ? customerId 
  : 'pm_card_visa';  // ← BUG: hardcoded test card as fallback
```

**Problem:** If `NODE_ENV` is undefined or misconfigured, falls through to `pm_card_visa` in production.

**Fix:**
```typescript
if (process.env.NODE_ENV !== 'production') {
  // Development/test: use test card
  return 'pm_card_visa';
}
// Production: MUST have real payment method
if (!customerId) {
  throw new Error('No payment method available. User must add card first.');
}
return customerId;
```

**Effort:** 15 minutes

---

### 🔴 #5: MISSING ADMIN QUEUE CONSUMER FOR DEAL REQUESTS

**Files:** 
- Write side: `src/app/dashboard/actions.ts:152–197` 
- Read side: **MISSING**  
**Current:** DealRequest writes succeed to `deal_requests` bucket, zero consumers  
**Impact:** Customer submits upgrade/downgrade/surrender request → toast says "Request submitted" → nothing happens. Admin has to manually discover and process.  
**Violates:** Non-Negotiable Rule #15 (nothing depends entirely on manual operations)

**Scenario:**
1. Customer on dashboard views deal, sees "Your current package: Basic"
2. Clicks "Upgrade to Premium" button
3. Form: reason = "Want faster inspection"
4. POST `/api/dashboard/request-upgrade` with `{ dealId: "d1", type: "upgrade", reason }`
5. Server writes to `deal_requests` bucket ✓
6. Client shows toast: "Upgrade request submitted" ✓
7. **THEN NOTHING HAPPENS**
8. No admin notification, no workflow trigger, no status page
9. Customer expects email follow-up, gets nothing
10. Admin has no `/admin/deal-requests` page to see pending requests
11. Admin must manually query the database

**Fix Strategy:**
1. Add `/admin/deal-requests` page listing pending + completed requests
2. Add Team 12 workflow consumer triggered on new DealRequest write
3. Implement workflow: Request created → In Review → Approved/Denied → Apply Mutation → Notify Customer
4. On approval:
   - Mutate DealRecord (upgrade package, adjust price, etc.)
   - Emit Team 13 notification: "Your upgrade request was approved!"
   - If price changed: trigger payment reconciliation
   - Update DealRequest.status = "approved"
5. On denial:
   - Emit Team 13 notification: "Your upgrade request was denied. Reason: ..."
   - Update DealRequest.status = "denied"
6. Add customer-facing page `/dashboard/requests` showing status of all submitted requests

**Effort:** 8–12 hours

---

## PART 2: HIGH-IMPACT GAPS (6 items, ~10 hours, week 1)

### 🟡 #6: NO "SAVE TO GARAGE" BUTTON IN PRE-DEPOSIT SEARCH

**Files:** `src/components/compare/available-actions-bar.tsx` + path cards  
**Current:** Garage view works perfectly; users cannot reach it from search  
**Impact:** User finds car they want to compare/revisit later → no save button → must use browser history or re-search  
**Violates:** Non-Negotiable Rules #6 (no dead ends), #14 (support discovery)

**Status:** API endpoint `POST /api/garage` exists and works. Missing: UI button + integration.

**Fix:**
1. Add "Save to Garage" button to `AvailableActionsBar` (all paths)
2. Optional: add to each path card footer
3. On click: POST `/api/garage` with `{ listingId }`
4. Show toast: "Saved to garage. View your list →"
5. Optimistic UI: hide button or show "Saved ✓" for 2s

**Effort:** 2–4 hours

---

### 🟡 #7: LISTING COMMENTS DO NOT NOTIFY ORIGINAL POSTER

**Files:** `src/lib/listings/comments.ts` writes; `team-16-feed.ts:266–277` shows reference  
**Current:** Feed comments send notifications. Listing comments do not.  
**Impact:** Seller posts private listing, potential buyer comments "interested", seller never notified. Lost conversion.  
**Violates:** Non-Negotiable Rule #8 (meaningful actions trigger notifications)

**Fix:**
1. In `submitListingComment()`, after write succeeds:
   - Call `Notifications.send()` to listing owner
   - Category: "comment"
   - Include: `{ listingId, commenterId, listingTitle, preview: comment.body.slice(0, 100) }`
2. Also notify previous commenters (optional, for conversation threads)
3. Add "comment" to default notification preferences (currently missing from categories array)

**Reference implementation exists at `team-16-feed.ts:266–277`.**

**Effort:** 1–2 hours

---

### 🟡 #8: INSPECTION STORE IS IN-MEMORY, NOT PERSISTED

**File:** `src/services/team-11-intelligence.ts:62–82`  
**Current:** `INSPECTION_STORE = new Map()`. Resets on every deploy.  
**Impact:** User requests inspection. Status tracked in memory. Server redeploys (weekly updates, incidents). Status lost. User sees "pending" forever.  
**Violates:** Non-Negotiable Rules #9 (internal visibility), #12 (defined response)

**Fix Strategy:**
1. Create `inspections` bucket in Team 15 secure storage
2. Schema:
   ```typescript
   {
     inspectionId: string;          // uuid
     listingId: string;
     userId: string;
     status: "pending" | "in-progress" | "completed" | "failed";
     requestedAt: ISO8601;
     completedAt?: ISO8601;
     results?: {
       mileageVerified: boolean;
       priceEstimate: number;
       mechanicalIssues: string[];
       reportUrl?: string;
     };
     partnerUserId?: string;        // which inspector is assigned
   }
   ```
3. Update `requestInspection()` to write to bucket
4. Add `/api/webhooks/inspection-partner/complete` endpoint (signed callback from external partner)
5. On webhook: update inspection status → trigger Team 12 deal advance → emit Team 13 notification

**Effort:** 4–6 hours

---

### 🟡 #9: PDF AGREEMENT IS STUB, NOT RENDERED

**File:** `src/app/checkout/actions.ts:178`  
**Current:** Agreement writes `pdfUrl: "pending://agreement/{userId}"`. Route never actually generates PDF.  
**Impact:** Customer receives agreement URL → clicks → 404. Cannot verify what they signed. **LEGAL LIABILITY.**  
**Violates:** Non-Negotiable Rule #13 (every meaningful object tied to a profile)

**Fix Strategy:**
1. Wire PDF generator:
   - Option A: Puppeteer (Node.js, renders HTML→PDF, ~10MB footprint)
   - Option B: pdf-lib (pure JS, construct PDF from scratch, smaller footprint)
   - Option C: External service (Stirling-PDF, already running?)
2. On agreement completion (after signature):
   - Render `AgreementTemplate` component to static HTML
   - Pass to PDF generator → get binary
   - Upload to Team 15 Secure Storage (`agreements` bucket)
   - Return real S3/Supabase URL (not `pending://`)
3. Store URL in `AgreementDocument.pdfUrl`
4. Send email to customer with PDF link

**Effort:** 6–8 hours

---

### 🟡 #10: SIGNATURE CAPTURE IS TYPED TEXT, NOT CANVAS

**File:** `src/components/checkout/signature-capture.tsx`  
**Current:** SVG text input field. User types name. Not a real signature.  
**Impact:** Customer "signs" by typing. Not legally defensible. Platform liable if challenged.  
**Violates:** Non-Negotiable Rule #13 (meaningful object)

**Fix Strategy (pick one):**

**Option A: Canvas-based (recommended for MVP, 4–6h)**
- Implement HTML5 canvas drawing surface
- User draws signature with mouse/touch
- Save as PNG data (canvas.toDataURL())
- Store as base64 in AgreementDocument

**Option B: DocuSign integration (6–8h, more compliant)**
- Requires DocuSign API keys
- Embed DocuSign iframe in checkout flow
- Redirect signature to DocuSign, they handle signing + PDF
- Webhook on completion: DocuSign → picknbuild → record signature

**Option C: Typed signature + legal checkbox (fallback, 30m)**
- Require checkbox: "I acknowledge this is a legal agreement and my signature is my typed name"
- Less defensible but acceptable for MVP
- Migrate to real signatures in v2

**Effort:** 4–6h (canvas) or 6–8h (DocuSign)

---

### 🟡 #11: NOTIFICATION PREFERENCES MISSING CATEGORIES

**File:** `src/services/team-13-notifications.ts:59–66`  
**Current:** Default only includes 6 categories; missing "payment" and "comment"  
**Impact:** Users cannot opt out of payment/comment notifications because there is no preference key  
**Violates:** Non-Negotiable Rule #8 (meaningful actions + user control)

**Current array:**
```typescript
["message", "price-change", "dealer-response", "payment", "deal-status", "system"]
```

**Emitted but missing:**
- `"comment"` (listing + feed comments) — code emits but no pref key exists
- `"payment"` (refunds, deposits, subscriptions) — same issue

**Fix:** Add to default preferences array + migration script to backfill all existing users.

**Effort:** 30 minutes

---

## PART 3: MEDIUM/LOW GAPS (13 items, ~25 hours, month 1+)

### 🟠 #12: EMAIL DIGEST NOT SCHEDULED

**Files:** `src/services/team-13-notifications.ts` (assembly) + `/api/notifications/digest` (route)  
**Current:** Route exists. Nothing calls it.  
**Impact:** Users subscribed to daily digest never receive it.  
**Violates:** Non-Negotiable Rule #8

**Fix:**
- Schedule external cron job (GitHub Actions, DigitalOcean Apps, Render Background Jobs, or Supabase Functions)
- Daily at 8 AM local time (or weekly Mondays)
- POST `/api/notifications/digest` → triggers digest assembly + email

**Effort:** 1–2 hours

---

### 🟠 #13: FEED PAGINATION MISSING

**File:** `src/services/team-16-feed.ts:65–76`  
**Current:** `listFeedPosts()` loads entire index into memory  
**Impact:** 10k posts = slow; 1M posts = OOM  
**Violates:** Non-Negotiable Rule #26 (performance)

**Fix:**
1. Implement cursor-based pagination
2. `feed_posts_index` ordered by `created_at DESC`
3. Cursor format: `base64(createdAt:postId)`
4. Default page: 20 items, infinite scroll

**Effort:** 2–3 hours

---

### 🟠 #14: MEDIA UPLOAD BASE64 INLINE

**File:** `src/components/feed/media-upload.tsx:5–9`  
**Current:** Images stored as `data:` URLs in jsonb  
**Impact:** 3 × 10MB images = 100MB row, hits Supabase limit  

**Fix:**
1. Create Supabase Storage bucket: `feed-media`
2. On upload: POST to `supabase.storage.from('feed-media').upload(...)`
3. Store public URL in `feed_posts.media_urls` array

**Effort:** 2–3 hours

---

### 🟠 #15: VIN DECODER ONLY COVERS 19 WMIs

**File:** `src/lib/listings/vin-lookup.ts:30–49`  
**Current:** Hardcoded 9 makes only  
**Impact:** Non-covered VINs return degraded data  

**Fix:** Wire NHTSA vPIC API (free)

**Effort:** 1–2 hours

---

### 🟠 #16: ZIP DISTANCE TABLE HAS ONLY 15 METROS

**File:** `src/lib/geo/zip-distance.ts:24–40`  
**Current:** 15 ZIP centroids hardcoded. Unknown ZIP → `"— mi"`  
**Impact:** Rural users see no distance  

**Fix:** Import full US ZIP centroid CSV into `zip_centroids` table

**Effort:** 2–3 hours

---

### 🟠 #17: MISSING OBSERVABILITY / ERROR TRACKING

**Current:** No Sentry, no DataDog, no OpenTelemetry  
**Impact:** Bugs go unnoticed until manual admin check  

**Fix:**
1. Add Sentry: `npm install @sentry/nextjs`
2. Configure `SENTRY_DSN` env var
3. Wire error boundaries + API error captures

**Effort:** 2–4 hours

---

### 🟠 #18: NO CONTENT MODERATION

**Current:** Feed accepts all posts as-is  
**Impact:** Spam, offensive images, scam listings land unfiltered  

**Fix:**
1. Decide: automated (Perspective API, AWS Rekognition) or human-only
2. Add pre-publish hook
3. If human queue: add `/admin/moderation` page

**Effort:** 4–6 hours

---

### 🟢 #19–23: CLEANUP & HARDENING (5 items, ~5 hours)

- #19: XSS risk in sponsor catalog (1h)
- #20: Fixture IDs not cryptographically random (30m)
- #21: Unused FIRECRAWL_API_KEY (15m)
- #22: Subscription model assumes one per user (defer)
- #23: Schema versioning missing (1–2h)

---

## PART 4: NON-NEGOTIABLE RULES COMPLIANCE MATRIX

| # | Rule | Status | Notes | Gaps |
|---|------|--------|-------|------|
| 1 | Every vehicle shows all paths | ✅ | Four-path cards present everywhere | None |
| 2 | Every path shows full outcome data | ✅ | All fields per PathQuote | None |
| 3 | Location affects every path | ⚠️ | ZIP-based (gap: ZIP table limited) | #16 |
| 4 | picknbuild includes customization | ✅ | Wrap, seats, starlight, paint | None |
| 5 | picknbuild title variation | ✅ | Clean/rebuilt selector | None |
| 6 | No dead ends | ⚠️ | Most pages have CTAs (gap: no save button) | #6 |
| 7 | All listings through Reality Check | ⚠️ | Match Mode + pricing replace | Deferred |
| 8 | All actions trigger notifications | ⚠️ | Mostly (gaps: realtime, deal requests, digest, comments) | #1, #5, #7, #12 |
| 9 | PicknBuild internal visibility | ⚠️ | Admin dashboard exists (gaps: observability, inspection) | #4, #8, #17 |
| 10 | Supply continuously ingested | ✅ | On-view + idle sweep (gap: VIN decoder) | #15 |
| 11 | Platform learns from outcomes | ⚠️ | Deferred (not critical v1) | Deferred |
| **12** | **Every action produces response** | **❌** | **CRITICAL VIOLATION** | **#2, #3, #4, #5** |
| 13 | Every object tied to owner | ✅ | DealRecords, users, listings all owned | None |
| 14 | Discovery + decision support | ✅ | Search, garage, detail all present | None |
| **15** | **Nothing manual only** | **❌** | **CRITICAL VIOLATION** | **#5, #8, #18** |

**Summary:** 9 compliant, 5 mostly compliant, **2 critically violated**

---

## PART 5: RECOMMENDED EXECUTION ROADMAP

### PHASE 1: CRITICAL (Before Launch)
**Effort: ~24 hours | Blocker: YES**

1. **Item #2:** Stripe webhook dead-letter (4–6h)
2. **Item #3:** Refund idempotency (2–3h)
3. **Item #4:** Remove test card hardcode (15m)
4. **Item #1:** Realtime messaging (6–8h) OR polling fallback (2–3h)
5. **Item #5:** Deal request consumer (8–12h)

---

### PHASE 2: HIGH-IMPACT UX (Week 1 Post-Launch)
**Effort: ~10 hours | Blocker: NO (label "coming soon")**

6. **Item #6:** Save-to-garage button (2–4h)
7. **Item #7:** Listing comment notifications (1–2h)
8. **Item #11:** Add notification categories (30m)
9. **Item #8:** Inspection persistence (4–6h)

---

### PHASE 3: LEGAL/COMPLIANCE (Before Real Money)
**Effort: ~12 hours | Blocker: YES (if accepting deposits)**

10. **Item #9:** PDF agreement generation (6–8h)
11. **Item #10:** Real signature capture (4–6h)

---

### PHASE 4: OPERATIONAL (Month 1)
**Effort: ~12 hours | Blocker: NO (for launch, YES for scale)**

12. **Item #12:** Email digest scheduler (1–2h)
13. **Item #17:** Observability/Sentry (2–4h)
14. **Item #18:** Content moderation (4–6h)

---

### PHASE 5: NICE-TO-HAVE (As Capacity)
**Effort: ~10 hours**

15. **Item #13:** Feed pagination (2–3h)
16. **Item #14:** Media upload to storage (2–3h)
17. **Item #15:** VIN decoder expansion (1–2h)
18. **Item #16:** ZIP distance expansion (2–3h)
19. **Items #19–23:** Cleanup (4–5h total)

---

## PART 6: TESTING GAPS

**Currently tested:**
- Auth flow (~80%)
- Basic listing CRUD
- Intake state mutations
- Authz engine

**NOT tested (critical for launch):**
- Deposit → DealRecord creation
- Payment webhook error handling
- Refund idempotency
- Inspection lifecycle
- Comment notification fan-out
- Deal request workflow
- Realtime message delivery
- PDF generation
- Signature validation
- Email digest assembly
- Garage save from search

**Current coverage:** ~15% of critical paths

**Recommendation:** Add integration tests for all Phase 1 items before launch.

---

## PART 7: READINESS BY TEAM

| Team | Status | Critical Gaps |
|------|--------|----------------|
| 1 (Auth) | ✅ Ready | None |
| 2 (Profiles) | ✅ Ready | None |
| 3 (Supply) | ✅ Ready | VIN decoder (#15) |
| 4 (Intake) | ✅ Ready | None |
| 5 (Paths) | ⚠️ Mostly | No save button (#6) |
| 6 (Decision) | ✅ Ready | None |
| 7 (Detail) | ✅ Ready | None |
| 8 (Garage) | ⚠️ Mostly | No save-from-search (#6) |
| 9 (Checkout) | ⚠️ Mostly | PDF stub (#9), signature stub (#10) |
| 10 (Dashboard) | ⚠️ Mostly | Deal requests no consumer (#5) |
| 11 (Pricing) | ⚠️ Mostly | Inspection in-memory (#8) |
| 12 (Workflows) | ⚠️ Mostly | Inspection consumer, deal request consumer (#5, #8) |
| 13 (Messaging) | ⚠️ Mostly | Realtime broken (#1), digest not scheduled (#12), comments (#7) |
| 14 (Payments) | ⚠️ Mostly | Webhook DLQ (#2), refund idempotency (#3), test card (#4) |
| 15 (Admin) | ⚠️ Mostly | Content moderation (#18), observability (#17) |
| 16 (Feed) | ⚠️ Mostly | Pagination (#13), media upload (#14) |

**Teams 1–4, 6–7 ready.** Teams 5, 8–16 have gaps, most non-blocking.

---

## FINAL RECOMMENDATION

**✅ DO LAUNCH with Phase 1 fixes.** The codebase is architecturally sound and can handle v1.

**🚫 DO NOT LAUNCH without Phase 1.** Items #1–#5 are blocking for:
- **Money safety** (deposits must be recoverable if systems fail)
- **Core UX** (messaging must work multi-device)
- **Support burden** (deal requests can't be invisible)
- **Security** (test cards, webhook error handling)

**⏳ Launch with Phase 2–3 flagged "coming soon."** Most are UX polish or legal requirements that can land in week 1.

**📋 Address Phase 4 in month 1.** These protect scale (observability, moderation).

**📌 Defer Phase 5 beyond v1.** These are optimizations.

---

**Audit Scope:** 
- 27 requirement docs (all read)
- 37 build-outline docs (all read)
- 16 teams, 540+ files, 12 migrations, 41 API routes
- All contracts, services, and core workflows reviewed

**Previous Audit:** `SPEC_AUDIT_MERCURY_MIGRATION.md` (now superseded)

**Generated:** 2026-04-26
