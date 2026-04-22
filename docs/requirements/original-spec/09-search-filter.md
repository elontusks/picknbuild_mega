# 09 - Search and Filter System

The main comparison interface must support persistent search and filtering. Search/filter is not a separate page or modal flow — it is the always-on control surface that shapes what the user sees across the main interface, the garage, and recommendations.

## Search / Filter Fields

The system must expose the following fields:

### Required

- Make
- Model
- Year
- Mileage
- Budget

### Optional

- Title preference
- Urgency / timeline sensitivity

| Field | Required? | Purpose |
| --- | --- | --- |
| Make | Required | Narrow to a manufacturer. |
| Model | Required | Narrow to a specific model. |
| Year | Required | Constrain by model year. |
| Mileage | Required | Constrain by odometer. |
| Budget | Required | Anchor price ceiling / range. |
| Title preference | Optional | Filter by title status preference. |
| Urgency / timeline sensitivity | Optional | Weight results by how quickly the user needs to buy. |

## Behavior

The search/filter surface must behave as follows:

- **Persists until changed.** Once a user sets a filter, it remains active across sessions and interactions until the user explicitly changes it.
- **Updates all paths dynamically.** Changes to any filter must dynamically update every downstream path on the main interface without a full reload or separate submission step.
- **Does not navigate away from the main interface.** Adjusting search/filter inputs must keep the user on the main comparison interface. The surface does not route the user to a separate search results page.
- **Powers the garage and recommendations.** The active filter state must feed directly into what shows up in the user's garage and what the recommendation engine surfaces.

## Interaction with Onboarding

The onboarding flow seeds initial search/filter state (location, budget, preferences). Once onboarding completes, users manipulate that state through this persistent search/filter surface. Skipped onboarding fields can be filled in here.

---

Source: §9
