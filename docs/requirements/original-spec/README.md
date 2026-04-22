# PicknBuild Requirements

> **Architecture + components moved.** The consolidated architecture lives at [../ARCHITECTURE.md](../ARCHITECTURE.md) and the component inventory at [../COMPONENTS.md](../COMPONENTS.md). The numbered files in this folder are kept as behavior / copy references that those two docs point back into.

Parsed from the PicknBuild onboarding spec. Each file covers a coherent slice and cites its source sections. Read `00-overview.md` and `01-non-negotiable-rules.md` first — every later doc assumes those principles.

## Index

### Foundations
- [00 — Overview](00-overview.md) — definition, core principle, core insight, final statement, scope clause (§1–3, §27)
- [01 — Non-negotiable system rules](01-non-negotiable-rules.md) — the 15 rules every feature must satisfy (§4)
- [02 — Core user flow](02-core-user-flow.md) — the 9-step flow from entry to routed transaction (§10)

### Supply
- [03 — Data ingestion & scraping engine](03-data-ingestion-scraping.md) — sources, behavior, refresh, failure handling (§4.10)
- [04 — Supply system](04-supply-system.md) — dealer / auction / individual ingestion, claim flow, "Found a Better Deal?", duplicates (§7)
- [05 — Location system](05-location-system.md) — location as a first-class variable for every path and calculation (§8)

### Users
- [06 — User types](06-user-types.md) — Buyer, Dealer, Individual seller, Internal team (§5)
- [07 — Profiles](07-profiles.md) — buyer, dealer, seller profiles + dealer claim page capabilities (§6, §29.11.6)
- [08 — Onboarding](08-onboarding.md) — intake fields and what they power (§29.8)
- [09 — Search & filter](09-search-filter.md) — persistent search driving all paths (§9)

### Decision engine
- [10 — Four path system](10-four-path-system.md) — Dealer, Auction DIY, picknbuild, Individual (§11)
- [11 — Reality Check Engine](11-reality-check-engine.md) — core intelligence layer, inputs / outputs / adaptive behavior (§12)
- [12 — Garage](12-garage.md) — decision engine, not saved items (§13)
- [13 — Vehicle detail view](13-vehicle-detail.md) — detail surface + timeline visibility (§29.11.7, §29.11.3)

### Communication & engagement
- [14 — Messaging](14-messaging.md) — on-platform messaging and transaction inference (§14)
- [15 — Notifications](15-notifications.md) — categories, channels, personalization, user preferences (§15, §29.11.5)
- [16 — Internal awareness](16-internal-awareness.md) — PicknBuild visibility into high-intent actions (§16)
- [17 — Feed & social](17-feed-social.md) — World of People algorithm, content types, media, user uploads (§17, §29.11.1, §29.11.4)
- [18 — Leaderboard, contests, badges, build credits](18-leaderboard-contests.md) — invite contest, rewards, grand prize (§18, §29.11.2, §29.11.8)

### Commerce & operations
- [19 — Monetization](19-monetization.md) — dealer leads, subscriptions, listing fees, picknbuild deposit, auction service fee (§19)
- [20 — Routing](20-routing.md) — every action has a defined system outcome (§20)
- [21 — Transaction tracking & outcome inference](21-transaction-tracking.md) — learn from on- and off-platform outcomes (§21)
- [22 — Payments](22-payments.md) — Stripe flows, refunds, subscriptions, logs (§22)

### Integrity & platform health
- [23 — Trust & verification](23-trust-verification.md) — trust indicators, identity verification, moderation, rate limiting (§23, §29.1–3)
- [24 — Empty states](24-empty-states.md) — no dead ends (§24)
- [25 — Admin / internal dashboard](25-admin-dashboard.md) — internal visibility surface (§25)
- [26 — Performance & mobile](26-performance-and-mobile.md) — responsiveness and mobile-first (§26, §29.9, §29.10)
- [27 — Platform integrity](27-platform-integrity.md) — disclaimers, data privacy, logging, external-failure handling (§29.4–7)

## Conventions in these docs

- Requirements are quoted verbatim where practical. Interpretations and restructuring are used only to improve readability.
- Each file ends with a `Source: §X` footer listing the covered spec sections.
- No invented features. If something is not in the spec, it is not in these docs.
- Per the spec's scope clause: everything in these docs is required scope unless explicitly excluded in writing.
