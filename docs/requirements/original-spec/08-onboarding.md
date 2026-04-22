# 08 - Onboarding Flow

The platform must guide users through an initial intake process. The intake is the first touchpoint that personalizes every downstream surface, so the data captured here is load-bearing for search quality, recommendations, the Reality Check, and how the feed is clustered.

## Fields Collected

Onboarding must collect the following fields. Optional skips are allowed where appropriate, so users are never blocked from entering the product by a single missing input.

| Field | Notes |
| --- | --- |
| Location | Used to localize listings, feed content, and dealer proximity. |
| Budget | Anchors search defaults and recommendation ranking. |
| Current car ownership | Establishes baseline context for the buyer. |
| Financial inputs | Income, expenses, credit estimate — feeds the Reality Check. |
| Preferences | Cheap vs fast vs customizable — shapes clustering and recommendations. |

### Itemized List

- Location
- Budget
- Current car ownership
- Financial inputs (income, expenses, credit estimate)
- Preferences (cheap vs fast vs customizable)

Optional skips must be allowed where appropriate so users can complete onboarding without committing to every field up front. Skipped fields can be filled in later via the profile or the search/filter surface.

## What the Onboarding Data Must Power

The data captured during onboarding must directly drive:

- **Search** — default filters and scoping are seeded from onboarding inputs.
- **Recommendations** — ranking and selection of suggested vehicles respect budget, location, and preference inputs.
- **Reality Check** — affordability and fit computations rely on the financial inputs (income, expenses, credit estimate) plus budget.
- **Feed clustering** — the feed groups and prioritizes posts based on preference axes (cheap vs fast vs customizable) and other onboarding signals.

---

Source: §29.8
