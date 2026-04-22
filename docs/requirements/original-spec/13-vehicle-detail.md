# Vehicle Detail View and Timeline Visibility

This document captures two tightly coupled mandatory requirements: the contents of the Vehicle Detail View, and the cross-surface Timeline Visibility rule.

---

## Vehicle Detail View (Mandatory)

The Vehicle Detail View is the single canonical surface for evaluating an individual vehicle. It must display every element listed below — no field may be omitted or deferred to a secondary screen.

### Required Display Elements

- **All available acquisition paths** — every one of the four paths (Dealer, Auction, picknbuild, Individual) that applies to this vehicle.
- **Reality Check breakdown** — the full set of outputs from the Reality Check Engine for this vehicle and this user.
- **Location**
- **Timeline**
- **Risk**
- **Effort**
- **Available actions** — start, message, contact.

### Notes

- The Vehicle Detail View is the point at which the four-path decision engine is resolved for a specific listing; all paths must be visible side-by-side so the user can compare them in place.
- The available actions (start, message, contact) must be wired to the action flows defined in the Four Path System (e.g. picknbuild's Start Now / Talk to Someone, Individual's in-platform messaging, Dealer contact).

Source: §29.11.7

---

## Timeline Visibility Requirement

Timeline must be a **required visible field across the entire system**. It is not optional on any surface that shows vehicles.

### Required Surfaces

Timeline must be displayed in:

| Surface              | Timeline Required |
| -------------------- | ----------------- |
| Vehicle cards        | Yes |
| Comparison views     | Yes |
| Garage summaries     | Yes |
| Vehicle detail views | Yes |

If a surface renders a vehicle in any form, it must render the timeline alongside it.

Source: §29.11.3

---

Source: §29.11.7, §29.11.3

