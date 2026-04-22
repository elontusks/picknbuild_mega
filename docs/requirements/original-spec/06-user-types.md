# 06 - User Types

The PicknBuild platform must support multiple distinct user types. Each type has its own set of permissions, notification rules, and monetization flows. The type of account determines how a user interacts with listings, the feed, profiles, and the rest of the system.

## Supported User Types

The system must support at least the following user types:

- **Buyer** — end users searching for and comparing vehicles, using the garage, Reality Check, and recommendation surfaces.
- **Dealer** — dealership accounts tied to a claimed Dealer Page, with listing, feed, and lead management capabilities.
- **Individual seller** — private sellers listing a single vehicle, with trust indicators and a message inbox.
- **PicknBuild internal team/admin** — internal staff with administrative privileges.

## Differentiation Across Types

Each user type differs along at least three axes:

| Axis | Description |
| --- | --- |
| Permissions | What the user can do (list, claim, post, moderate, etc.). |
| Notifications | Which events the user is notified about and through which channels. |
| Monetization flows | How the user is billed, subscribed, or otherwise transacts with the platform. |

Implementation detail for each type's specific permissions, notifications, and monetization flows is covered in the per-surface and per-feature requirement documents.

---

Source: §5
