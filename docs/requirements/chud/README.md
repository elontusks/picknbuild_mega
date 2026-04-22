# PicknBuild — Updated Build Spec (chud)

> **Architecture + components moved.** The consolidated architecture lives at [../ARCHITECTURE.md](../ARCHITECTURE.md) and the component inventory at [../COMPONENTS.md](../COMPONENTS.md). [DROPPED.md](DROPPED.md) is still authoritative for what was cut and why. The numbered files in this folder are kept as behavior / copy references that the consolidated docs point back into.

Parsed from `../chud.md` — the "Final Updated Build Outline" + Star Package System spec. This is an additive/refinement layer on top of the base requirements. Read `00-overview.md` first.

## Index

### Foundations
- [00 — Overview](00-overview.md) — four-path model, Three Ds, final goal, scope (§1–2, §41–43)
- [01 — Top controls](01-top-controls.md) — main control area, credit input, No Credit, clean/rebuilt (§3–5)

### Discovery + compare
- [02 — Match Mode & link parser](02-match-mode-and-link-parser.md) — Match Mode, "Already Found a Car?" (§6–7)
- [03 — Empty states](03-empty-states.md) — no dead ends (§8)
- [04 — Four-path display](04-four-path-display.md) — path labels, copy, branding, detail requirements (§9, §39)
- [05 — Sponsor boards](05-sponsor-boards.md) — path-specific sponsor zones (§10)

### Decision engine
- [06 — Your Best Path Right Now](06-best-path-right-now.md) — recommendation component + Dreamer/Delayer/Decider copy (§11–12)
- [07 — What Matters Most](07-what-matters-most.md) — priority selector, dynamic recommendations, "See Cars" CTA (§13–15)

### Reality / gap view
- [08 — See Where You Stand](08-see-where-you-stand.md) — rename, structure, path toggle, auto-cycle, ranges rule (§16–20)
- [09 — Gap view by path](09-gap-view-paths.md) — term selector + dealer/pnb/auction/private gap logic + barriers (§21–26)

### picknbuild path logic
- [10 — picknbuild pricing](10-picknbuild-pricing.md) — credit risk, term risk, price formula, payment cadence (§27–31)
- [11 — picknbuild customization & builds](11-picknbuild-customization-and-builds.md) — customizations, Add to Your Build (§32–33)

### Other path logic
- [12 — Already have a car](12-already-have-a-car.md) — existing vehicle estimate flow (§34)
- [13 — Trade-in](13-trade-in.md) — dealer + picknbuild trade-in (§35)
- [14 — Dealer APR](14-dealer-apr.md) — APR tiers, financing updates (§36)
- [15 — External signal flows](15-external-signals.md) — dealer / private seller signal loops (§37)
- [16 — Auction behavior](16-auction-behavior.md) — auction core (§38)

### System behavior
- [17 — Live updates & scope](17-live-updates-and-scope.md) — live update rule, scope, developer priority order (§40–42)

### Conversion + commitment
- [18 — Conversion flow](18-conversion-flow.md) — two-step conversion, path CTAs, post-conversion, monetization (§44–51)
- [19 — Commitment & agreements](19-commitment-and-agreements.md) — spec commitment, agreement form (§52–55)
- [20 — Deposit, payment, dashboard](20-deposit-and-post-deposit.md) — deposit, payment tracking, post-deposit state, dashboard (§56–64)

### Guidance layer
- [21 — Checklist](21-guidance-checklist.md) — step-by-step decision enforcement (§65–69)
- [22 — Inspection Partner](22-guidance-inspection.md) — trusted third-party verification (§70–72)
- [23 — Pricing Guidance](23-guidance-pricing.md) — "is this a good deal?" + personalized guidance (§73–81)

### Buying Power
- [24 — Buying Power](24-buying-power.md) — cash vs outside-money reality layer (§82–90)

### Build tools
- [25 — Katzkin seat integration](25-katzkin-seats.md) — seat customization source (§91)
- [26 — Build Your Deal calculator](26-build-your-deal-calculator.md) — interactive self-calculation layer (§92)

### Star Package System (configurator + checkout)
- [27 — Global system rules + title explainer](27-star-package-global-rules.md) — two distinct flows + clean/rebuilt tooltip
- [28 — picknbuild configurator](28-picknbuild-configurator.md) — Build Your Deal single-screen configurator, packages, live price panel
- [29 — Auction service flow](29-auction-service-flow.md) — bidding service, funding, outcomes, liability
- [30 — Digital agreement & dashboard](30-digital-agreement-and-dashboard.md) — vehicle definition, substitution, agreement, account, customer + admin dashboards

## Conventions

- Content is preserved verbatim where practical; restructured only for readability.
- Each file ends with a `Source: §X` footer referencing chud.md section numbers.
- `picknbuild` is always lowercase; the branding rule elsewhere (only the `n` is red) is a UI concern, not a text convention in these docs.
- Everything here is additive to the existing requirements unless marked as replacing an older rule.
