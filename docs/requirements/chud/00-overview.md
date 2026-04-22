# Overview

## Core Product Model — Four Paths

The platform compares 4 ways to get a car:

1. Dealer
2. Auction / DIY
3. picknbuild
4. Private Seller

Each vehicle or parsed deal must feed into the same four-path comparison system. All four paths are shown in one place — the user does not need to leave the platform to compare options.

## Final Product Goal (implementable surfaces)

The experience is composed of these concrete surfaces and behaviors. Each links to the spec file where it is defined:

- **Intake controls** — capture vehicle preferences (make, model, year, mileage, trim), available cash, credit score, No Credit toggle, clean/rebuilt preference, location, and urgency → [01-top-controls.md](01-top-controls.md)
- **Four-path comparison display** — every vehicle/deal renders Dealer, Auction/DIY, picknbuild, and Private Seller side-by-side with required fields per path → [04-four-path-display.md](04-four-path-display.md)
- **Your Best Path Right Now** — persistent recommendation component above the paths, neutral (not hardcoded to picknbuild), updates live from inputs → [06-best-path-right-now.md](06-best-path-right-now.md)
- **What Matters Most** — priority selector (max 2) that drives the recommendation and forces trade-offs → [07-what-matters-most.md](07-what-matters-most.md)
- **See Where You Stand** — additive gap panel showing all-in cost, buying power, and the gap vs. user's current cash/credit → [08-see-where-you-stand.md](08-see-where-you-stand.md), [24-buying-power.md](24-buying-power.md)
- **Already Found a Car?** — paste-a-link parser that builds an internal listing object and runs it through the four-path display → [02-match-mode-and-link-parser.md](02-match-mode-and-link-parser.md)
- **Already Have a Car?** — VIN (or year/make/model fallback) estimate flow for upgrade/repair work → [12-already-have-a-car.md](12-already-have-a-car.md)
- **Customization + Add to Your Build** — selectable customization options plus link/image/file/note attachments stored on the build → [11-picknbuild-customization-and-builds.md](11-picknbuild-customization-and-builds.md)
- **External signal flows** — dealer lead and private-seller signals that pull off-platform supply back into platform workflows → [15-external-signals.md](15-external-signals.md)
- **No dead-end empty states** — every empty state shows estimated paths, alternatives, and a paste-a-deal prompt → [03-empty-states.md](03-empty-states.md)
- **All-in pricing** — every price surfaced is Total Cost / All-in, never raw sticker alone → [08-see-where-you-stand.md](08-see-where-you-stand.md), [16-auction-behavior.md](16-auction-behavior.md)
- **Live updates** — credit, No Credit, clean/rebuilt, trade-in, term, customizations, priorities, and parsed listings all recalc instantly with no search button → [17-live-updates-and-scope.md](17-live-updates-and-scope.md)

---

Source: §1 Core Product Model, §43 Final Product Goal
