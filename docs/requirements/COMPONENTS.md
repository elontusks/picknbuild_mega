# PicknBuild Components

Every component the app builds, grouped by owning team (numbers match ARCHITECTURE.md §4). Each row names its **Type**, **Owner**, what data it **Inputs**, what it **Outputs** (render + emitted events), what it **Talks to** (sibling components, by name), and the **Source docs** for behavior and copy.

Rule: every edge in a **Talks to** list appears as a reciprocal edge on the other component's row. If you see a mismatch, one side is missing a contract — flag it.

Type vocabulary:
- **page** — a full route
- **panel** — overlay / drawer / modal on an existing page
- **component** — reusable UI block
- **flow** — multi-step user journey
- **service** — backend or client-side engine, no direct UI
- **data model** — persisted shape (see ARCHITECTURE.md §3)
- **state** — client-side store or engine
- **job** — periodic backend task

Source-doc prefixes: `os/NN` = `original-spec/NN-*.md`; `ch/NN` = `chud/NN-*.md`.

---

## Team 1 — Foundations

**Auth Service** · service · T1 · Inputs: phone + verification code → issues session · Outputs: authenticated `User`; `requireAuth` gate · Talks to: Onboarding Wizard, Global Shell, User Record · Sources: os/08, os/27

**Onboarding Wizard** · flow · T1 · Inputs: ZIP (required), budget (required), phone (required), car ownership, income/expenses, credit estimate, preferences · Outputs: persisted `User` record; routes to Search · Talks to: Auth Service, User Record, Global Shell · Sources: os/08

**User Record** · data model · T1 · Inputs: signup + onboarding fields; credit / preference updates · Outputs: `User` contract (ARCHITECTURE.md §3.7) · Talks to: Auth Service, Onboarding Wizard, Buyer Profile View, Dealer Profile / Page, Individual Seller Profile, Top Controls Bar, Credit Score Input + No-Credit Toggle, Recommendation Engine, Credit-Tiered Down-Payment Resolver, Dealer APR Tier Logic, Notification Service, Payment Tracking System · Sources: os/06, os/07, os/08

**Global Shell** · component · T1 · Inputs: current route, auth state, bell count, inbox unread count · Outputs: top nav, side/bottom nav, layout slots · Talks to: Auth Service, Mobile Navigation Bar, Responsive Design Framework, Notification Center / Bell Icon, Notification Badge / Counter, In-App Notification Toasts, Message Inbox / Conversation List · Sources: os/26

**Mobile Navigation Bar** · component · T1 · Inputs: current route · Outputs: route tabs (Search / Garage / Inbox / Profile) · Talks to: Global Shell, Responsive Design Framework · Sources: os/26

**Responsive Design Framework** · service · T1 · Inputs: viewport width · Outputs: breakpoint tokens used across UI · Talks to: Global Shell, Mobile Navigation Bar · Sources: os/26

**Legal Disclaimer Library** · component · T1 · Inputs: context key (estimate / financing / non-refundable) · Outputs: rendered disclaimer strings · Talks to: Every path card via Team 5, Live Price Panel, Agreement Form, Non-refundable Conditions Notice, Insurance-Required Notice · Sources: os/27

---

## Team 2 — Profiles

**Buyer Profile View** · page · T2 · Inputs: `User`, saved-search list, garage link · Outputs: profile render · Talks to: User Record, Garage View / Container, Message Inbox / Conversation List · Sources: os/07

**Dealer Profile / Page** · page · T2 · Inputs: dealer `User`, dealer-owned `ListingObject` list · Outputs: dealer render + "active listings" grid · Talks to: User Record, ListingObject Store, Vehicle Card / Summary Card, Dealer Page Edit Panel (for dealer-mode), Message Inbox / Conversation List · Sources: os/07

**Dealer Page Edit Panel** · panel · T2 · Inputs: dealer `User`; editable listing draft · Outputs: create / update / remove `ListingObject` rows with `source: "dealer"`, `ownerUserId: dealerId` · Talks to: User Record, ListingObject Store, Dealer-Posted Listing Form, Dealer Subscription Management Panel, Lead Unlock Purchase Interface, Listing Price Modal · Sources: os/04, os/07

**Individual Seller Profile** · page · T2 · Inputs: seller `User`, one active user-posted `ListingObject` · Outputs: chat-handle + active listing render · Talks to: User Record, ListingObject Store, Message Inbox / Conversation List · Sources: os/06, os/07

---

## Team 3 — Supply / Data Plane

**Ingestion Normalizer** · service · T3 · Inputs: raw scraper output (Copart, IAAI, Craigslist — black-box upstream) · Outputs: writes `ListingObject` rows into ListingObject Store · Talks to: ListingObject Store, Inventory Ingestion Health Monitor · Sources: os/03, os/04

**ListingObject Store** · data model · T3 · Inputs: normalizer writes; dealer/user UI writes; on-view refresh writes · Outputs: `ListingObject` contract (§3.1); list / get / filter-by-owner endpoints · Talks to: Ingestion Normalizer, On-View Refresh Service, Idle Sweep Service, Link Parser Service, User-Generated Listing Upload, Dealer-Posted Listing Form, Dealer Page Edit Panel, Top Controls Bar, Dealer Path Card, Auction Path Card, picknbuild Path Card, Private Seller Path Card, Vehicle Detail View, Vehicle Card / Summary Card, Garage View / Container, Match Mode Matching Engine, Pricing Guidance Service, Recommendation Engine, Listings Inventory View, Feed Post Card · Sources: os/03, os/04, os/ARCHITECTURE Implementation Notes

**On-View Refresh Service** · service · T3 · Inputs: `listingId`, source, `last_refreshed_at` · Outputs: refreshed `ListingObject` if past cooldown (auction 1h, craigslist 24h, dealer none); no-op otherwise · Talks to: ListingObject Store, Vehicle Detail View · Sources: os/ARCHITECTURE Implementation Notes

**Idle Sweep Service** · job · T3 · Inputs: listings with no interaction for N days · Outputs: marks rows `stale` / `removed` · Talks to: ListingObject Store, Inventory Ingestion Health Monitor · Sources: os/ARCHITECTURE Implementation Notes

**Link Parser Service** · service · T3 · Inputs: `{url}` · Outputs: normalized `ListingObject` with `source: "parsed-link"`; or fallback error · Talks to: "Already Found a Car?" Link Parser Input, Manual Fallback Entry, ListingObject Store · Sources: ch/02

**VIN Lookup Service** · service · T3 · Inputs: `{vin}` · Outputs: `{year, make, model, trim, mileage?, titleStatus?}` · Talks to: Trade-In Flow, Already-Have-a-Car Flow, Trade-In Value Service, Already-Have-a-Car Estimator · Sources: ch/12, ch/13

**User-Generated Listing Upload** · component + service · T3 · Inputs: seller form fields + photos · Outputs: `ListingObject` with `source: "user"`, `ownerUserId` · Talks to: ListingObject Store, User Vehicle Upload Form (Feed), Individual Seller Profile · Sources: os/04

**Dealer-Posted Listing Form** · component · T3 (UI mounted in T2 edit panel) · Inputs: dealer form fields · Outputs: `ListingObject` with `source: "dealer"`, `ownerUserId` · Talks to: ListingObject Store, Dealer Page Edit Panel · Sources: os/04

---

## Team 4 — Search Intake

**Top Controls Bar** · component · T4 · Inputs: `User.zip`, current `IntakeState` · Outputs: writes intake fields on change; fires live recompute · Talks to: User Record, IntakeState (store), Credit Score Input + No-Credit Toggle, Clean/Rebuilt Preference Toggle, picknbuild Down Payment Tier Table, Match Mode Toggle, "Already Found a Car?" Link Parser Input, Manual Fallback Entry, Filter Persistence Indicator, Search/Filter Control Panel, Title Preference Filter, ListingObject Store, Four-Path Comparison Display, Your Best Path Right Now, See Where You Stand Panel · Sources: ch/01, os/02, os/09

**Search/Filter Control Panel** · component · T4 · Inputs: current `IntakeState` · Outputs: make/model/year/mileage/budget fields · Talks to: Top Controls Bar, IntakeState, Filter Persistence Indicator · Sources: os/09

**Credit Score Input + No-Credit Toggle** · component · T4 · Inputs: `User.creditScore`, local edit · Outputs: writes `creditScore` / `noCredit` into `IntakeState` · Talks to: Top Controls Bar, IntakeState, picknbuild Down Payment Tier Table, Dealer Path Card, picknbuild Path Card, Credit-Tiered Down-Payment Resolver, Dealer APR Tier Logic · Sources: ch/01, ch/10, ch/14

**picknbuild Down Payment Tier Table** · component · T4 · Inputs: current `creditScore` / `noCredit` · Outputs: renders resolved down-payment % as reference card · Talks to: Credit Score Input + No-Credit Toggle, Credit-Tiered Down-Payment Resolver · Sources: ch/01, ch/10

**Clean/Rebuilt Preference Toggle** · component · T4 · Inputs: current `IntakeState.titlePreference` · Outputs: writes `titlePreference` · Talks to: Top Controls Bar, IntakeState, Title Preference Filter, "What is Clean vs Rebuilt?" Tooltip, Title Badge, Dealer Path Card, Auction Path Card, picknbuild Path Card, Private Seller Path Card, picknbuild Total-Price Formula, Trade-In Value Service · Sources: ch/01, ch/13, ch/27

**Title Preference Filter** · component · T4 · Inputs: `IntakeState.titlePreference` · Outputs: hides listings where parsed title is neither clean nor rebuilt when filter is strict · Talks to: Clean/Rebuilt Preference Toggle, Top Controls Bar, Four-Path Comparison Display · Sources: os/09, os/ARCHITECTURE Implementation Notes

**"What is Clean vs Rebuilt?" Tooltip** · component · T4 · Inputs: — · Outputs: static copy · Talks to: Clean/Rebuilt Preference Toggle, Legal Disclaimer Library · Sources: ch/01, ch/27

**Filter Persistence Indicator** · component · T4 · Inputs: `IntakeState` diffs · Outputs: renders "filters active" chip · Talks to: Top Controls Bar, Search/Filter Control Panel · Sources: os/09

**Match Mode Toggle** · component · T4 · Inputs: `IntakeState` · Outputs: flips `matchMode` flag; causes backend filter to reality · Talks to: Top Controls Bar, IntakeState, Match Mode Matching Engine, Four-Path Comparison Display · Sources: ch/02, ch/07

**"Already Found a Car?" Link Parser Input** · component · T4 · Inputs: `{url}` · Outputs: posts to Link Parser Service; resolves into a `ListingObject` rendered through four-path display · Talks to: Link Parser Service, Manual Fallback Entry, Four-Path Comparison Display · Sources: ch/02, ch/03

**Manual Fallback Entry** · component · T4 · Inputs: `{title, price, image}` when parser fails · Outputs: minimal `ListingObject` · Talks to: "Already Found a Car?" Link Parser Input, Link Parser Service, ListingObject Store · Sources: ch/02

**IntakeState** · state · T4 · Inputs: writes from every intake component + gap-view term selector · Outputs: `IntakeState` contract (§3.2) via shared store · Talks to: Top Controls Bar, Credit Score Input + No-Credit Toggle, Clean/Rebuilt Preference Toggle, Search/Filter Control Panel, Match Mode Toggle, Choose Your Term Selector, Four-Path Comparison Display, Your Best Path Right Now, See Where You Stand Panel, Buying Power Layer, Dealer Path Card, Auction Path Card, picknbuild Path Card, Private Seller Path Card, picknbuild Configurator Page, Recommendation Engine, Match Mode Matching Engine · Sources: ch/17, os/09

---

## Team 5 — Four-Path Comparison

**Four-Path Comparison Display** · page section · T5 · Inputs: active listing (or result set), `IntakeState` · Outputs: four cards side-by-side · Talks to: Top Controls Bar, IntakeState, Dealer Path Card, Auction Path Card, picknbuild Path Card, Private Seller Path Card, Your Best Path Right Now, See Where You Stand Panel, Title Preference Filter, Match Mode Toggle, "Already Found a Car?" Link Parser Input · Sources: ch/00, ch/04, os/02, os/10

**Dealer Path Card** · component · T5 · Inputs: `ListingObject` (dealer-sourced), `IntakeState`, `PathQuote(path="dealer")` · Outputs: renders sticker / down / monthly / APR / distance / title + risk badges; renders "not approved" when credit tier fails; emits `select("dealer")` · Talks to: Four-Path Comparison Display, ListingObject Store, IntakeState, Dealer APR Tier Logic, Clean/Rebuilt Preference Toggle, Credit Score Input + No-Credit Toggle, Title Badge, Risk Badge, Best-Fit Badge, Path-Specific Sponsor Board, Your Best Path Right Now, See Where You Stand Panel, Trade-In Flow, Dealer Gap Logic Module, External Signal Flow — Dealer Lead, Two-Step Conversion State Machine · Sources: ch/04, ch/14, os/10

**Auction Path Card** · component · T5 · Inputs: `ListingObject` (auction-sourced), `IntakeState`, `PathQuote(path="auction")` · Outputs: renders current bid / BIN / estimated market value / fees / all-in / timeline / distance / title + risk badges; emits `select("auction")` · Talks to: Four-Path Comparison Display, ListingObject Store, IntakeState, Title Badge, Risk Badge, Best-Fit Badge, Path-Specific Sponsor Board, Your Best Path Right Now, See Where You Stand Panel, Auction Gap Logic Module, Two-Step Conversion State Machine · Sources: ch/04, ch/16, os/10

**picknbuild Path Card** · component · T5 · Inputs: `ListingObject` (any source), `IntakeState`, `PathQuote(path="picknbuild")` · Outputs: renders credit-tiered down % / total / bi-weekly by term / distance / title + risk badges; emits `select("picknbuild")` → routes to Configurator · Talks to: Four-Path Comparison Display, ListingObject Store, IntakeState, Credit-Tiered Down-Payment Resolver, picknbuild Total-Price Formula, Bi-Weekly Payment Calculation, Term-to-Cadence Resolver, Clean/Rebuilt Preference Toggle, picknbuild Customization Toggles, Trade-In Flow, Already-Have-a-Car Flow, Title Badge, Risk Badge, Best-Fit Badge, Path-Specific Sponsor Board, Your Best Path Right Now, See Where You Stand Panel, picknbuild Gap Logic Module, picknbuild Configurator Page, Two-Step Conversion State Machine · Sources: ch/04, ch/10, ch/11, os/10

**Private Seller Path Card** · component · T5 · Inputs: `ListingObject` (craigslist/user-posted), `IntakeState`, `PathQuote(path="private")` · Outputs: renders cash price / negotiable indicator / distance / title + risk badges; emits `select("private")` · Talks to: Four-Path Comparison Display, ListingObject Store, IntakeState, Title Badge, Risk Badge, Best-Fit Badge, Path-Specific Sponsor Board, Your Best Path Right Now, See Where You Stand Panel, Private Seller Gap Logic Module, External Signal Flow — Private Seller Invite, Two-Step Conversion State Machine · Sources: ch/04, ch/15, os/10

**Path Comparison Row** · component · T5 · Inputs: the four `PathQuote` responses for one vehicle · Outputs: tabular side-by-side view (reused in Garage) · Talks to: Four-Path Comparison Display, Garage Comparison Table · Sources: os/10

**Title Badge** · component · T5 · Inputs: `ListingObject.titleStatus` · Outputs: "Clean" / "Rebuilt" / "Unknown" chip · Talks to: Every path card, "What is Clean vs Rebuilt?" Tooltip · Sources: ch/01, ch/04

**Risk Badge** · component · T5 · Inputs: `User.creditScore` · Outputs: low/med/high chip · Talks to: Every path card, Vehicle Detail View, Garage Item Card, Comparison Table · Sources: os/10, os/ARCHITECTURE Implementation Notes

**Best-Fit Badge** · component · T5 · Inputs: four `PathQuote` results + `User.preferences.bestFit` · Outputs: badge on one winning card · Talks to: Every path card, User Record · Sources: os/10, os/ARCHITECTURE Implementation Notes

**Path-Specific Sponsor Board** · component · T5 · Inputs: `{path}` · Outputs: sponsor blocks from Sponsor Catalog · Talks to: Every path card, Sponsor Catalog · Sources: ch/05

**picknbuild Customization Toggles** · component · T5 (card-level) + T9 (configurator-level) · Inputs: current `BuildRecord.customizations` · Outputs: writes toggles (wrap / seats / starlight / paint); triggers price recompute · Talks to: picknbuild Path Card, picknbuild Configurator Page, Live Price Panel, BuildRecord (store), picknbuild Total-Price Formula · Sources: ch/11, ch/28

**Trade-In Flow** · flow · T5 · Inputs: `{vin, titleStatus}` · Outputs: `estimatedTradeInValue` written into BuildRecord; decrement applied before Dealer / picknbuild pricing · Talks to: VIN Lookup Service, Trade-In Value Service, Dealer Path Card, picknbuild Path Card, BuildRecord · Sources: ch/13, ch/00

**Already-Have-a-Car Flow** · flow · T5 · Inputs: `{vin}` or fallback `{year, make, model, mileage, trim}` + desired work list · Outputs: estimate or "quote required" state; writes to BuildRecord · Talks to: VIN Lookup Service, Already-Have-a-Car Estimator, picknbuild Path Card, BuildRecord · Sources: ch/00, ch/12

---

## Team 6 — Decision & Gap

**Your Best Path Right Now** · component · T6 · Inputs: `IntakeState`, four `PathQuote` outcomes · Outputs: `{recommendedPath, reason, supportingBullets, alternatives, primaryCta}` render + sticky card · Talks to: IntakeState, Four-Path Comparison Display, Dealer Path Card, Auction Path Card, picknbuild Path Card, Private Seller Path Card, See Where You Stand Panel, Recommendation Engine · Sources: ch/00, ch/06

**See Where You Stand Panel** · panel · T6 · Inputs: `IntakeState`, active listing, four `PathQuote` outcomes · Outputs: gap panel with per-path modules · Talks to: IntakeState, Four-Path Comparison Display, Path Toggle (Gap View), Auto-Cycle Behavior, Choose Your Term Selector, Dealer Gap Logic Module, picknbuild Gap Logic Module, Auction Gap Logic Module, Private Seller Gap Logic Module, Barrier-to-Entry Line, Buying Power Layer, Buying Power Visualization Bar, Your Best Path Right Now · Sources: ch/00, ch/06, ch/08, ch/09

**Path Toggle (Gap View)** · component · T6 · Inputs: current `activeGapPath` · Outputs: emits new active path · Talks to: See Where You Stand Panel, Auto-Cycle Behavior, Dealer Gap Logic Module, picknbuild Gap Logic Module, Auction Gap Logic Module, Private Seller Gap Logic Module · Sources: ch/08, ch/09

**Auto-Cycle Behavior** · state · T6 · Inputs: timer, user interaction · Outputs: advances `activeGapPath` until user selects · Talks to: Path Toggle (Gap View), See Where You Stand Panel · Sources: ch/08

**Choose Your Term Selector** · component · T6 · Inputs: current `IntakeState.selectedTerm` · Outputs: writes selected term into `IntakeState` for Dealer + picknbuild gap modules · Talks to: IntakeState, See Where You Stand Panel, Dealer Gap Logic Module, picknbuild Gap Logic Module, picknbuild Total-Price Formula, Dealer APR Tier Logic · Sources: ch/09, ch/10, ch/14

**Dealer Gap Logic Module** · component · T6 · Inputs: `PathQuote(path="dealer")` for current term · Outputs: renders down / monthly / total / interest / barrier line · Talks to: See Where You Stand Panel, Path Toggle (Gap View), Choose Your Term Selector, Barrier-to-Entry Line, Buying Power Layer, Dealer APR Tier Logic · Sources: ch/09, ch/14

**picknbuild Gap Logic Module** · component · T6 · Inputs: `PathQuote(path="picknbuild")` for current term · Outputs: renders down / biweekly / total / barrier line · Talks to: See Where You Stand Panel, Path Toggle (Gap View), Choose Your Term Selector, Barrier-to-Entry Line, Buying Power Layer, picknbuild Total-Price Formula, Bi-Weekly Payment Calculation · Sources: ch/09, ch/10

**Auction Gap Logic Module** · component · T6 · Inputs: `PathQuote(path="auction")` · Outputs: renders current bid / predicted final / fees / all-in / timeline / barrier line · Talks to: See Where You Stand Panel, Path Toggle (Gap View), Barrier-to-Entry Line, Buying Power Layer · Sources: ch/09, ch/16

**Private Seller Gap Logic Module** · component · T6 · Inputs: `PathQuote(path="private")` · Outputs: renders cash / barrier line · Talks to: See Where You Stand Panel, Path Toggle (Gap View), Barrier-to-Entry Line, Buying Power Layer · Sources: ch/09

**Barrier-to-Entry Line** · component · T6 · Inputs: gap module `barrierLine` string · Outputs: one-line "what this path really requires" · Talks to: Every gap logic module · Sources: ch/09

**Buying Power Layer** · component · T6 · Inputs: `IntakeState.cash`, active gap module's `total` · Outputs: pure-client math `{yourCash, totalCost, buyingPower, outsideMoneyNeeded}` · Talks to: IntakeState, Every gap logic module, Buying Power Visualization Bar · Sources: ch/24

**Buying Power Visualization Bar** · component · T6 · Inputs: Buying Power Layer output · Outputs: stacked-bar render · Talks to: Buying Power Layer, See Where You Stand Panel · Sources: ch/24

---

## Team 7 — Vehicle Detail

**Vehicle Detail View** · page · T7 · Inputs: `ListingObject`, `IntakeState`, four `PathQuote` outcomes · Outputs: canonical single-vehicle page · Talks to: ListingObject Store, On-View Refresh Service, IntakeState, All Acquisition Paths Display, Available Actions Bar, Comments / Replies Section, Distance Display, Down Payment Display, Vehicle Card / Summary Card, Pricing Guidance Service, Inspection Partner Routing Service, Checklist, Two-Step Conversion State Machine · Sources: os/13, ch/04

**All Acquisition Paths Display** · component · T7 · Inputs: four `PathQuote` outcomes · Outputs: four-paths inline block within the detail page · Talks to: Vehicle Detail View, Dealer Path Card, Auction Path Card, picknbuild Path Card, Private Seller Path Card · Sources: os/13

**Available Actions Bar** · component · T7 · Inputs: `ConversionState`, path context · Outputs: Start / Message / Contact actions · Talks to: Vehicle Detail View, Two-Step Conversion State Machine, Message Inbox / Conversation List, External Signal Flow — Dealer Lead, External Signal Flow — Private Seller Invite, picknbuild Configurator Page · Sources: os/13, os/20

**Comments / Replies Section** · component · T7 · Inputs: `listingId` · Outputs: thread render + post new comment · Talks to: Vehicle Detail View, Secure Storage Layer, User Record · Sources: os/13

**Distance Display** · component · T7 · Inputs: `User.zip`, `ListingObject.locationZip` · Outputs: miles render (haversine, cached) · Talks to: Vehicle Detail View, Vehicle Card / Summary Card, Every path card, Garage Item Card · Sources: os/05, os/10, os/13

**Down Payment Display** · component · T7 · Inputs: `PathQuote.down` per path · Outputs: per-path down-payment render · Talks to: Vehicle Detail View, Every path card · Sources: os/10, os/13

**Vehicle Card / Summary Card** · component · T7 · Inputs: `ListingObject` · Outputs: compact card reused across surfaces · Talks to: ListingObject Store, Four-Path Comparison Display, Garage Item Card, Vehicle Card in Feed, Dealer Profile / Page, Individual Seller Profile · Sources: os/02, os/13

---

## Team 8 — Garage

**Garage View / Container** · page · T8 · Inputs: user's saved-vehicle set, active `IntakeState` (for filters) · Outputs: grouped saved-vehicles render · Talks to: Secure Storage Layer, IntakeState, Vehicle Grouping Display, Garage Item Card, Comparison Table, Decision Highlight Badges, Garage Action Buttons, Garage Filter Integration, Pass/Pick Decision Interface, Vehicle Card / Summary Card · Sources: os/02, os/12

**Vehicle Grouping Display** · component · T8 · Inputs: saved set · Outputs: grouped by YMM · Talks to: Garage View / Container, Garage Item Card · Sources: os/12

**Garage Item Card** · component · T8 · Inputs: one saved `ListingObject` + its four `PathQuote` snapshots · Outputs: condensed card with best-fit badges · Talks to: Garage View / Container, Vehicle Card / Summary Card, Distance Display, Risk Badge, Title Badge, Decision Highlight Badges, Garage Action Buttons, Comparison Table · Sources: os/12

**Comparison Table** · component · T8 · Inputs: saved set's `PathQuote` rows · Outputs: row per vehicle, column per path metric (path, distance, down, monthly, sticker, credit-risk badge) · Talks to: Garage View / Container, Garage Item Card, Path Comparison Row, Decision Highlight Badges, Risk Badge · Sources: os/12

**Decision Highlight Badges** · component · T8 · Inputs: Comparison Table rows · Outputs: marks best total out-of-pocket / lowest monthly cells · Talks to: Comparison Table, Garage Item Card · Sources: os/12, os/ARCHITECTURE Implementation Notes

**Garage Action Buttons** · component · T8 · Inputs: selected garage item · Outputs: Start picknbuild / Talk / Contact dealer / Message seller / Compare all paths clicks · Talks to: Garage Item Card, picknbuild Configurator Page, Two-Step Conversion State Machine, External Signal Flow — Dealer Lead, External Signal Flow — Private Seller Invite, Message Inbox / Conversation List · Sources: os/12, os/20

**Garage Filter Integration** · component · T8 · Inputs: `IntakeState` · Outputs: applies active filters to garage set · Talks to: Garage View / Container, IntakeState, Search/Filter Control Panel · Sources: os/09, os/12

**Pass/Pick Decision Interface** · component · T8 · Inputs: candidate listings · Outputs: pass / pick action; pick writes to saved set · Talks to: Garage View / Container, Vehicle Card / Summary Card, Secure Storage Layer · Sources: os/02, os/26

---

## Team 9 — Commit / Checkout

**picknbuild Configurator Page** · page · T9 · Inputs: picknbuild `PathQuote` carried over from compare, optional anchor `listingId`, `IntakeState`, current `BuildRecord` · Outputs: configurator surface · Talks to: picknbuild Path Card (entry from), IntakeState, BuildRecord, Package Cards, "What Your Package Includes" Disclosure, Live Price Panel, picknbuild Customization Toggles, "Add to Your Build" Attachments, Spec-Based Commitment Summary, Agreement Form, Deposit Checkout, Insurance-Required Notice, Non-Refundable Conditions Notice, picknbuild Total-Price Formula, Bi-Weekly Payment Calculation, Term-to-Cadence Resolver · Sources: ch/28, ch/30

**Package Cards** · component · T9 · Inputs: available packages (Standard / Premium / Silver / Platinum / Gold) with term mapping · Outputs: writes `BuildRecord.selectedPackage` · Talks to: picknbuild Configurator Page, Live Price Panel, BuildRecord, Term-to-Cadence Resolver, picknbuild Total-Price Formula · Sources: ch/28, ch/30

**"What Your Package Includes" Disclosure** · component · T9 · Inputs: — · Outputs: static rules (insurance-required, walk-away, no credit impact) · Talks to: picknbuild Configurator Page, Legal Disclaimer Library · Sources: ch/28

**Live Price Panel** · component · T9 · Inputs: `BuildRecord`, selected package, term, customizations, tax/shipping toggles · Outputs: `{total, down, biweekly}` · Talks to: picknbuild Configurator Page, Package Cards, picknbuild Customization Toggles, picknbuild Total-Price Formula, Bi-Weekly Payment Calculation, Term-to-Cadence Resolver, Legal Disclaimer Library · Sources: ch/28

**"Add to Your Build" Attachments** · component · T9 · Inputs: links / files / images / notes · Outputs: writes into `BuildRecord.attachments` · Talks to: picknbuild Configurator Page, BuildRecord, Secure Storage Layer, Media Upload Interface · Sources: ch/11

**BuildRecord** · data model · T9 · Inputs: customization toggles, attachments, package, trade-in, already-have-a-car · Outputs: `BuildRecord` contract (§3.3) · Talks to: picknbuild Path Card, picknbuild Customization Toggles, picknbuild Configurator Page, "Add to Your Build" Attachments, Package Cards, Trade-In Flow, Already-Have-a-Car Flow, Spec-Based Commitment Summary, Agreement Form, Deposit Checkout, Two-Step Conversion State Machine · Sources: ch/11, ch/19

**Spec-Based Commitment Summary** · component · T9 · Inputs: `BuildRecord` + pricing snapshot · Outputs: rendered `{makeModelYearRange, mileageRange, titleType, customizations, attachments, creditScore, cash, term}` · Talks to: picknbuild Configurator Page, BuildRecord, Agreement Form · Sources: ch/19, ch/30

**Agreement Form** · form · T9 · Inputs: Spec-Based Commitment Summary + path-specific clauses · Outputs: `AgreementDocument` (§3.5) · Talks to: picknbuild Configurator Page, Spec-Based Commitment Summary, Digital Signature Capture, Insurance-Required Notice, Non-Refundable Conditions Notice, Deposit Checkout, Secure Storage Layer, Legal Disclaimer Library · Sources: ch/19, ch/30

**Digital Signature Capture** · component · T9 · Inputs: user signature gesture/input · Outputs: signature payload attached to `AgreementDocument` · Talks to: Agreement Form, Secure Storage Layer · Sources: ch/19, ch/30

**Deposit Checkout** · flow · T9 · Inputs: signed `AgreementDocument`, $1,000 Stripe charge intent · Outputs: deposit-success event; triggers `DealRecord` creation · Talks to: Agreement Form, BuildRecord, Stripe Integration, Payment Processing Interface, Payment Tracking System, Two-Step Conversion State Machine · Sources: ch/18, ch/19, ch/20, ch/28

**Insurance-Required Notice** · component · T9 · Inputs: — · Outputs: static render · Talks to: picknbuild Configurator Page, Agreement Form, Legal Disclaimer Library · Sources: ch/28

**Non-Refundable Conditions Notice** · component · T9 · Inputs: — · Outputs: static render · Talks to: picknbuild Configurator Page, Agreement Form, Legal Disclaimer Library · Sources: ch/28, ch/30

---

## Team 10 — Post-Deposit Dashboard

**Customer Dashboard** · page · T10 · Inputs: `DealRecord`, linked `PaymentRecord`s, `MessageThread`s · Outputs: single dashboard surface · Talks to: DealRecord (T12), PaymentRecord (T14), Post-Deposit "Build Started" Workflow, Payment History View, Wire Instructions Display, Status Timeline, Upgrade / Downgrade / Voluntary Surrender Flows, Post-Conversion Status View, Message Inbox / Conversation List · Sources: ch/20, ch/30

**Status Timeline** · component · T10 · Inputs: `DealRecord.timeline` · Outputs: chronological stage render · Talks to: Customer Dashboard, Post-Deposit "Build Started" Workflow · Sources: ch/20, ch/30

**Payment History View** · component · T10 · Inputs: `PaymentRecord[]` · Outputs: list of charges / refunds / statuses · Talks to: Customer Dashboard, Payment Tracking System · Sources: ch/30

**Wire Instructions Display** · component · T10 · Inputs: `DealRecord.id` · Outputs: account/reference strings for balance wires · Talks to: Customer Dashboard, Wire Instructions Generator · Sources: ch/20, ch/28

**Upgrade / Downgrade / Voluntary Surrender Flows** · flow · T10 · Inputs: user request + reason · Outputs: request event to admin queue; status back on dashboard · Talks to: Customer Dashboard, Two-Step Conversion State Machine, Secure Storage Layer, Admin Dashboard, Manual Moderation Actions · Sources: ch/30

**Post-Conversion Status View** · component · T10 · Inputs: `ConversionState`, path taken · Outputs: per-path state render (Build Started, dealer-lead sent, seller-notified, etc.) · Talks to: Customer Dashboard, Two-Step Conversion State Machine, External Signal Flow — Dealer Lead, External Signal Flow — Private Seller Invite, Post-Deposit "Build Started" Workflow · Sources: ch/18, ch/20

---

## Team 11 — Pricing & Intelligence Backend

**Credit-Tiered Down-Payment Resolver** · service · T11 · Inputs: `creditScore` or `noCredit` · Outputs: `downPaymentPercentage` · Talks to: picknbuild Down Payment Tier Table, Credit Score Input + No-Credit Toggle, picknbuild Path Card, picknbuild Total-Price Formula · Sources: ch/01, ch/10

**picknbuild Total-Price Formula** · service · T11 · Inputs: `{basePrice, tax, fees, customizations, titleStatus, creditScore, tradeInValue, term}` · Outputs: `PathQuote(path="picknbuild")` · Talks to: picknbuild Path Card, picknbuild Gap Logic Module, Live Price Panel, Package Cards, picknbuild Customization Toggles, Credit-Tiered Down-Payment Resolver, Bi-Weekly Payment Calculation, Term-to-Cadence Resolver, Choose Your Term Selector, Clean/Rebuilt Preference Toggle, Trade-In Value Service · Sources: ch/10

**Bi-Weekly Payment Calculation** · service · T11 · Inputs: `{remaining, term}` · Outputs: `biweeklyPayment` · Talks to: picknbuild Total-Price Formula, picknbuild Gap Logic Module, Live Price Panel, Term-to-Cadence Resolver · Sources: ch/10

**Term-to-Cadence Resolver** · service · T11 · Inputs: term (1y–5y) · Outputs: biweekly count (26/52/78/104/130) · Talks to: picknbuild Total-Price Formula, Bi-Weekly Payment Calculation, Package Cards, Choose Your Term Selector · Sources: ch/10, os/ARCHITECTURE Implementation Notes

**Dealer APR Tier Logic** · service · T11 · Inputs: `{creditScore, dealerListing, term}` · Outputs: `PathQuote(path="dealer")` with `{apr, monthly, totalPaid, interestPaid, approvedBool}` · Talks to: Dealer Path Card, Dealer Gap Logic Module, Credit Score Input + No-Credit Toggle, Choose Your Term Selector · Sources: ch/14

**Trade-In Value Service** · service · T11 · Inputs: `{vin, titleStatus}` · Outputs: `{estimatedTradeInValue}` · Talks to: Trade-In Flow, VIN Lookup Service, picknbuild Total-Price Formula, Dealer APR Tier Logic · Sources: ch/13

**Already-Have-a-Car Estimator** · service · T11 · Inputs: `{vin}` or fallback vehicle fields + desired work list · Outputs: estimate or "quote required" · Talks to: Already-Have-a-Car Flow, VIN Lookup Service · Sources: ch/12

**Recommendation Engine** · service · T11 · Inputs: full `IntakeState` + four `PathQuote`s · Outputs: `{recommendedPath, reason, supportingBullets, alternatives, primaryCta}` · Talks to: Your Best Path Right Now, IntakeState, User Record · Sources: ch/06

**Pricing Guidance Service** · service · T11 · Inputs: `{listing, path}` · Outputs: `{verdict: "low"|"fair"|"high", reasonLine, marketRange?, negotiationAnchor?}` · Talks to: Vehicle Detail View, Every path card (via context), ListingObject Store · Sources: ch/23

**Inspection Partner Routing Service** · service · T11 · Inputs: `{listingId}` · Outputs: inspection status + eventual `{conditionSummary, issues, severity, recommendation}` · Talks to: Vehicle Detail View, ListingObject Store · Sources: ch/22, ch/23

**Match Mode Matching Engine** · service · T11 · Inputs: `IntakeState` (with `matchMode: true`) · Outputs: filtered `ListingObject` list fitting cash/credit/title/location reality · Talks to: Match Mode Toggle, IntakeState, ListingObject Store · Sources: ch/02, ch/07

**Checklist** · component · T11 (service) + T7 (UI) · Inputs: `(path, listingId, userId)` · Outputs: stage items + persisted completion state · Talks to: Vehicle Detail View, Secure Storage Layer · Sources: ch/21, ch/23

---

## Team 12 — Workflows Backend

**Two-Step Conversion State Machine** · service · T12 · Inputs: path-CTA events from Teams 5/8, deposit-success from Team 14 · Outputs: `ConversionState` (§3.6) transitions; `DealRecord` creation on `deposit-received` · Talks to: Dealer Path Card, Auction Path Card, picknbuild Path Card, Private Seller Path Card, Garage Action Buttons, Available Actions Bar, Deposit Checkout, picknbuild Configurator Page, Post-Deposit "Build Started" Workflow, External Signal Flow — Dealer Lead, External Signal Flow — Private Seller Invite, DealRecord, Post-Conversion Status View, Customer Dashboard, Notification Service · Sources: ch/18

**Post-Deposit "Build Started" Workflow** · service · T12 · Inputs: `DealRecord` transitions · Outputs: sourcing → purchased → in-transit → delivered state updates · Talks to: DealRecord, Two-Step Conversion State Machine, Status Timeline, Customer Dashboard, Notification Service · Sources: ch/20

**External Signal Flow — Dealer Lead** · service · T12 · Inputs: `select("dealer")` CTA · Outputs: lead record, dealer notification · Talks to: Dealer Path Card, Available Actions Bar, Garage Action Buttons, Dealer Profile / Page, Lead Unlock Purchase Interface, Notification Service, Post-Conversion Status View · Sources: ch/15, ch/18

**External Signal Flow — Private Seller Invite** · service · T12 · Inputs: `select("private")` CTA · Outputs: invite record, seller onboarding message · Talks to: Private Seller Path Card, Available Actions Bar, Garage Action Buttons, Individual Seller Profile, Notification Service, Post-Conversion Status View · Sources: ch/15, ch/18

**DealRecord** · data model · T12 · Inputs: transition events · Outputs: `DealRecord` contract (§3.4) · Talks to: Two-Step Conversion State Machine, Post-Deposit "Build Started" Workflow, Customer Dashboard, Status Timeline, Payment Tracking System, Admin Dashboard, Active Deals Tracker · Sources: ch/30, os/22

---

## Team 13 — Messaging + Notifications

**Socket Transport** · service · T13 · Inputs: authenticated sockets · Outputs: realtime message delivery · Talks to: User Record, Chat Window / Message Thread, Message Inbox / Conversation List, Message History Display · Sources: os/14

**Message Inbox / Conversation List** · component · T13 · Inputs: `MessageThread[]` for user · Outputs: inbox render · Talks to: Global Shell, Socket Transport, Chat Window / Message Thread, Buyer ↔ Individual Seller Chat, Buyer ↔ picknbuild Team Chat, Buyer ↔ Dealer Chat, Buyer Profile View, Dealer Profile / Page, Individual Seller Profile, Garage Action Buttons, Available Actions Bar, Customer Dashboard · Sources: os/14

**Chat Window / Message Thread** · component · T13 · Inputs: `threadId` · Outputs: message stream · Talks to: Socket Transport, Message Inbox / Conversation List, Message History Display, Media Upload Interface · Sources: os/14

**Message History Display** · component · T13 · Inputs: `threadId` · Outputs: paginated history · Talks to: Chat Window / Message Thread, Secure Storage Layer · Sources: os/14

**Buyer ↔ Individual Seller Chat** · flow · T13 · Inputs: buyer + seller user ids, optional listing · Outputs: thread of kind `"buyer-seller"` · Talks to: Message Inbox / Conversation List, Chat Window / Message Thread · Sources: os/14

**Buyer ↔ picknbuild Team Chat** · flow · T13 · Inputs: buyer, `DealRecord` optional · Outputs: thread of kind `"buyer-picknbuild"` · Talks to: Message Inbox / Conversation List, Chat Window / Message Thread, Customer Dashboard · Sources: os/14

**Buyer ↔ Dealer Chat** · flow · T13 · Inputs: buyer + dealer user ids, listing · Outputs: thread of kind `"buyer-dealer"` · Talks to: Message Inbox / Conversation List, Chat Window / Message Thread, External Signal Flow — Dealer Lead · Sources: os/14

**Notification Service** · service · T13 · Inputs: event streams from Teams 12, 14, self · Outputs: `Notification` records, fan-out to channels · Talks to: User Record, Notification Preferences Storage, Notification Center / Bell Icon, In-App Notification Toasts, Notification History / Log, Email Notification Digest, Two-Step Conversion State Machine, Post-Deposit "Build Started" Workflow, External Signal Flow — Dealer Lead, External Signal Flow — Private Seller Invite, Stripe Integration, Failed Payment Recovery Service · Sources: os/15

**Notification Preferences Storage** · data model · T13 · Inputs: user toggles · Outputs: per-user channel + category preferences · Talks to: Notification Service, Notification Preferences Panel, User Record · Sources: os/15

**Notification Center / Bell Icon** · component · T13 · Inputs: unread `Notification` list · Outputs: dropdown render · Talks to: Global Shell, Notification Service, Notification Badge / Counter, Notification History / Log · Sources: os/15

**Notification Badge / Counter** · component · T13 · Inputs: unread count · Outputs: numeric badge · Talks to: Global Shell, Notification Center / Bell Icon · Sources: os/15

**In-App Notification Toasts** · component · T13 · Inputs: fresh `Notification` events · Outputs: toast render · Talks to: Global Shell, Notification Service · Sources: os/15

**Notification History / Log** · component · T13 · Inputs: all user `Notification`s · Outputs: filterable list · Talks to: Notification Center / Bell Icon, Notification Service · Sources: os/15

**Email Notification Digest** · service · T13 · Inputs: preferences, new notifications · Outputs: scheduled email digest · Talks to: Notification Service, Notification Preferences Storage · Sources: os/15

**Notification Preferences Panel** · panel · T13 · Inputs: `Notification Preferences Storage` · Outputs: preferences UI · Talks to: Notification Preferences Storage, Notification Service, Buyer Profile View · Sources: os/15

---

## Team 14 — Payments Backend

**Stripe Integration** · service · T14 · Inputs: charge / refund / subscription intents · Outputs: Stripe side effects + `PaymentRecord`s · Talks to: Deposit Checkout, Payment Processing Interface, Payment Tracking System, Subscription Lifecycle Service, Refund / Deposit Reconciliation Service, Failed Payment Recovery Service, Dealer Subscription Management Panel, Lead Unlock Purchase Interface, Listing Price Modal, Notification Service · Sources: os/22

**Subscription Lifecycle Service** · service · T14 · Inputs: dealer subscription events · Outputs: subscription state transitions · Talks to: Stripe Integration, Dealer Subscription Management Panel, Subscription Status Display, Payment Tracking System · Sources: os/22

**Refund / Deposit Reconciliation Service** · service · T14 · Inputs: deposit event, refund eligibility rules · Outputs: refund `PaymentRecord`s · Talks to: Stripe Integration, Payment Tracking System, Refund Status Display, Customer Dashboard · Sources: os/22

**Failed Payment Recovery Service** · service · T14 · Inputs: failed charge events · Outputs: retry schedule + user-facing recovery flow · Talks to: Stripe Integration, Payment Processing Interface, Notification Service · Sources: os/22

**Payment Tracking System** · service + component · T14 · Inputs: every `PaymentRecord` · Outputs: ledgered history per user/deal · Talks to: Stripe Integration, Subscription Lifecycle Service, Refund / Deposit Reconciliation Service, Payment History View, Customer Dashboard, Payment Activity Log, DealRecord · Sources: os/22, ch/20, ch/30

**Lead Unlock Purchase Interface** · component · T14 · Inputs: dealer, lead id · Outputs: $15 charge + unlock · Talks to: Dealer Page Edit Panel, Stripe Integration, External Signal Flow — Dealer Lead · Sources: os/19

**Dealer Subscription Management Panel** · panel · T14 · Inputs: dealer `User` · Outputs: $99/mo subscription management · Talks to: Dealer Page Edit Panel, Stripe Integration, Subscription Lifecycle Service, Subscription Status Display · Sources: os/19, os/22

**Listing Price Modal** · component · T14 · Inputs: dealer, listing count over free tier · Outputs: $5-per-extra-listing charge · Talks to: Dealer Page Edit Panel, Stripe Integration · Sources: os/19

**Payment Processing Interface** · component · T14 · Inputs: payment intent · Outputs: Stripe-hosted flow render · Talks to: Stripe Integration, Deposit Checkout, Payment Receipt / Confirmation, Failed Payment Recovery Service · Sources: os/22

**Payment Receipt / Confirmation** · component · T14 · Inputs: `PaymentRecord` · Outputs: receipt render · Talks to: Payment Processing Interface, Payment History View · Sources: os/22

**Refund Status Display** · component · T14 · Inputs: refund `PaymentRecord`s · Outputs: status render (for picknbuild deposit refunds) · Talks to: Refund / Deposit Reconciliation Service, Customer Dashboard · Sources: os/22

**Subscription Status Display** · component · T14 · Inputs: dealer subscription state · Outputs: status render · Talks to: Subscription Lifecycle Service, Dealer Subscription Management Panel · Sources: os/22

**Wire Instructions Generator** · service · T14 · Inputs: `DealRecord.id` · Outputs: account + reference strings for balance wires · Talks to: Wire Instructions Display, DealRecord · Sources: ch/20, ch/28

---

## Team 15 — Admin + Integrity

**Admin Dashboard** · page · T15 · Inputs: operator auth · Outputs: admin entry page · Talks to: Users View, Listings Inventory View, Feed Activity Monitor, Active Deals Tracker, Payment Activity Log, Dealer Subscriptions Manager, Inventory Ingestion Health Monitor, Manual Moderation Actions, Upgrade / Downgrade / Voluntary Surrender Flows · Sources: os/16, os/25

**Users View** · component · T15 · Inputs: `User[]` · Outputs: user list + detail · Talks to: Admin Dashboard, User Record · Sources: os/25

**Listings Inventory View** · component · T15 · Inputs: `ListingObject[]` · Outputs: listings list + detail + moderation · Talks to: Admin Dashboard, ListingObject Store, Manual Moderation Actions · Sources: os/25

**Feed Activity Monitor** · component · T15 · Inputs: feed post counts + recent posts · Outputs: dashboard tile · Talks to: Admin Dashboard, Feed View / Main Feed Surface · Sources: os/16, os/25

**Active Deals Tracker** · component · T15 · Inputs: `DealRecord[]` counts · Outputs: dashboard tile · Talks to: Admin Dashboard, DealRecord · Sources: os/25

**Payment Activity Log** · component · T15 · Inputs: `PaymentRecord[]` · Outputs: ledger view · Talks to: Admin Dashboard, Payment Tracking System · Sources: os/25

**Dealer Subscriptions Manager** · component · T15 · Inputs: subscription states · Outputs: admin-side dealer subs view · Talks to: Admin Dashboard, Subscription Lifecycle Service · Sources: os/25

**Inventory Ingestion Health Monitor** · component · T15 · Inputs: scraper / ingestion run status · Outputs: health tile · Talks to: Admin Dashboard, Ingestion Normalizer, Idle Sweep Service · Sources: os/25

**Manual Moderation Actions** · component · T15 · Inputs: listing id / user id + action · Outputs: remove / suspend side effects · Talks to: Admin Dashboard, Listings Inventory View, Users View, Upgrade / Downgrade / Voluntary Surrender Flows · Sources: os/25

**System Logging Interface** · service · T15 · Inputs: events from every team · Outputs: structured log stream · Talks to: Monitoring Dashboard · Sources: os/27

**Monitoring Dashboard** · page · T15 · Inputs: log + metric streams · Outputs: ops dashboard · Talks to: System Logging Interface · Sources: os/27

**Data Privacy Controls Backend** · service · T15 · Inputs: update / delete requests · Outputs: applied mutations to user financial fields · Talks to: User Record, Secure Storage Layer · Sources: os/27

**Secure Storage Layer** · service · T15 · Inputs: arbitrary records · Outputs: encrypted persistence · Talks to: Comments / Replies Section, Garage View / Container, Pass/Pick Decision Interface, Agreement Form, Digital Signature Capture, Message History Display, Payment Tracking System, Checklist, Upgrade / Downgrade / Voluntary Surrender Flows, "Add to Your Build" Attachments, Feed Post Card · Sources: os/27

**Sponsor Catalog** · data model + service · T15 · Inputs: operator-curated sponsor blocks · Outputs: sponsor list keyed by path · Talks to: Path-Specific Sponsor Board · Sources: ch/05

---

## Team 16 — Feed

**Feed View / Main Feed Surface** · page · T16 · Inputs: feed posts · Outputs: feed render · Talks to: User Record, Feed Post Card, Feed Engagement Controls, Vehicle Card in Feed, Profile Link from Feed Post, Feed Clustering, Feed Activity Monitor · Sources: os/17

**Feed Post Card** · component · T16 · Inputs: one feed post · Outputs: card render selecting by template · Talks to: Feed View / Main Feed Surface, Deal Post Template, Problem/Experience Post Template, Question Post Template, Build Post Template, Recommendation Post Template, Warning Post Template, Feed Engagement Controls, Vehicle Card in Feed, Profile Link from Feed Post, Secure Storage Layer, ListingObject Store · Sources: os/17

**Deal Post Template** · component · T16 · Inputs: deal post fields · Outputs: template render · Talks to: Feed Post Card · Sources: os/17

**Problem/Experience Post Template** · component · T16 · Inputs: problem post fields · Outputs: template render · Talks to: Feed Post Card · Sources: os/17

**Question Post Template** · component · T16 · Inputs: question post fields · Outputs: template render · Talks to: Feed Post Card · Sources: os/17

**Build Post Template** · component · T16 · Inputs: before/after/progress fields · Outputs: template render · Talks to: Feed Post Card · Sources: os/17

**Recommendation Post Template** · component · T16 · Inputs: recommendation post fields · Outputs: template render · Talks to: Feed Post Card · Sources: os/17

**Warning Post Template** · component · T16 · Inputs: warning post fields · Outputs: template render · Talks to: Feed Post Card · Sources: os/17

**Feed Engagement Controls** · component · T16 · Inputs: post id · Outputs: like / comment / reply / share actions · Talks to: Feed Post Card, Feed View / Main Feed Surface · Sources: os/17

**Vehicle Card in Feed** · component · T16 · Inputs: `ListingObject` · Outputs: clickable vehicle card in feed context (wraps Vehicle Card / Summary Card) · Talks to: Feed Post Card, Vehicle Card / Summary Card, Four-Path Comparison Display · Sources: os/17

**Profile Link from Feed Post** · component · T16 · Inputs: poster user id · Outputs: link to profile · Talks to: Feed Post Card, Buyer Profile View, Dealer Profile / Page, Individual Seller Profile · Sources: os/17

**Media Upload Interface** · component · T16 · Inputs: files / images / video · Outputs: uploaded refs · Talks to: Feed Post Card, User Vehicle Upload Form, "Add to Your Build" Attachments, Chat Window / Message Thread, Secure Storage Layer · Sources: os/17

**User Vehicle Upload Form** · component · T16 (form UI) + T3 (persistence) · Inputs: seller-supplied fields · Outputs: `ListingObject` + optional feed post · Talks to: Feed View / Main Feed Surface, User-Generated Listing Upload, ListingObject Store, Media Upload Interface · Sources: os/04, os/17

**Feed Clustering** · service · T16 · Inputs: posts + user signals · Outputs: ordered feed · Talks to: Feed View / Main Feed Surface · Sources: os/17

---

## Appendix A — Most-Referenced Components

Useful starting points for agents picking up a new area.

1. **ListingObject Store** (T3) — read by Teams 2, 4, 5, 6, 7, 8, 11, 15, 16.
2. **Vehicle Card / Summary Card** (T7) — reused in Search, Garage, Feed, Profiles.
3. **Four-Path Comparison Display** (T5) — the anchor UI of the pre-deposit flow.
4. **Vehicle Detail View** (T7) — canonical single-vehicle surface.
5. **Garage View / Container** (T8) — saved-vehicles surface; reads every core contract.
6. **Customer Dashboard** (T10) — post-deposit landing page.
7. **picknbuild Configurator Page** (T9) — commit surface.
8. **Two-Step Conversion State Machine** (T12) — binds pre- and post-deposit flows.
9. **IntakeState** (T4) — every search-side component writes/reads it.
10. **User Record** (T1) — depended on by everyone.

---

## Appendix B — Dropped components

Not in scope — see ARCHITECTURE.md §7 and `chud/DROPPED.md` for reasoning.

- Dreamer / Delayer / Decider user-state messaging variants
- Empty-state "no dead ends" estimated-paths layer
- "What Matters Most" priority selector
- "See Cars You Can Get Today" CTA (was the companion to What Matters Most)
- Katzkin seat integration
- "Build Your Deal" interactive calculator (the multi-step self-calc panel — not the Configurator page)
- Auction Service (paid "we bid for you" flow): Start Auction Support CTA, Auction Support Started post-deposit status, $2,500 procurement fee, dedicated Auction Service page
- Reality Check Engine
- Leaderboard + Contests
- Transaction Tracking / Outcome Inference
- Trust Verification (trust badges / trust scores)
- Report / Moderation Queue (replaced by ad-hoc Manual Moderation Actions)
- Invite / Referral system
- Urgency first-class intake field
- PicknBuild Delivery as a standalone product (it is a post-deposit workflow stage instead)
- "Found a Better Deal" external-link paste as a marketed feature (same capability is the Link Parser)
- Dealer credit estimator
- Dealer scraping / dealer claim flow
- Shipping estimate / location-aware pricing
- Cross-source dedup / historical price tracking per VIN
