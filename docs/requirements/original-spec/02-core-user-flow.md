# Core User Flow

The canonical 9-step flow that a user follows through PicknBuild, from arrival to transaction routing.

## The 9 Steps

1. **User enters platform.**
2. **System asks for or detects location.**
3. **User optionally enters financial inputs and preferences.**
4. **System generates vehicle options and shows four acquisition paths.**
5. **User can pass or pick in each path.**
6. **Picks go to Garage.**
7. **Garage groups and compares choices.**
8. **User chooses a path.**
9. **The system routes the user into the appropriate transaction or support flow.**

## Step Summary Table

| Step | Actor | Action | Output |
|------|-------|--------|--------|
| 1 | User | Enters platform | Session begins |
| 2 | System | Asks for or detects location | Location context established |
| 3 | User | Optionally enters financial inputs and preferences | Personalization inputs |
| 4 | System | Generates vehicle options and shows four acquisition paths | Vehicle + four-path view |
| 5 | User | Passes or picks in each path | Pass/pick decisions |
| 6 | System | Sends picks to Garage | Picks stored in Garage |
| 7 | Garage | Groups and compares choices | Comparison view |
| 8 | User | Chooses a path | Path selection |
| 9 | System | Routes into the appropriate transaction or support flow | Transaction/support flow entry |

## Notes on Flow Semantics

- Location (step 2) is required context because, per the non-negotiable rules, location must affect every path and every calculation.
- Financial inputs (step 3) are **optional**; the flow must still function without them.
- Step 4 requires the system to present **four acquisition paths** for each generated vehicle option.
- Step 5 supports **both pass and pick** actions within each path.
- The Garage (steps 6-7) is the surface where picks are grouped and compared across paths.
- Step 9 branches into either a **transaction flow** or a **support flow**, depending on the path the user chose in step 8.

---

Source: §10 Core User Flow.
