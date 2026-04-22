# Top Controls — Main Search Area, Credit, Clean/Rebuilt

The main control area must support the core search/comparison experience plus the new features below. **Do not remove existing controls. Extend them.**

## Controls to Support

- Location
- Need / intent
- Buy
- Make
- Model
- Year
- Mileage
- Trim
- Available cash right now
- Credit score
- No Credit toggle
- Clean / Rebuilt preference
- Match Mode
- "Already found a car? Compare it here"

## Credit Score Input

User can enter a score manually.

### No Credit toggle

Add a simple toggle under credit score:

> No Credit

When checked:
- treat as highest-risk case for picknbuild
- Dealer should become unavailable / not approved
- Dealer financing breakdown should not show normal financing output
- picknbuild should still function

### Dealer unavailable state (when No Credit is on)
- "Most likely not approved"
- optional subtext: "Dealer financing usually requires approval"

## picknbuild Down Payment by Credit

Credit score maps directly to a **down payment percentage** on the picknbuild path. Lower credit = more cash upfront. The tiers are visualized with traffic-light colors.

| Band | Score | Down |
|------|------:|-----:|
| 🔴 Red | 600 | 22% |
|  | 625 | 21% |
|  | 650 | 20% |
| 🟡 Yellow | 650 | 20% |
|  | 675 | 18% |
|  | 700 | 16% |
| 🟢 Green | 700 | 16% |
|  | 725 | 14% |
|  | 750 | 13% |
|  | 775 | 12.5% |
|  | 800+ | 12% |

**Floor:** under 600 or No Credit → locks at **22%**.

Between listed scores, interpolate linearly. The band color is a UI cue only — the percentage is the source of truth.

## Clean / Rebuilt Logic

### What Clean vs Rebuilt means

Clean and Rebuilt refer to the vehicle's **title status** — the legal/DMV record of the car's history.

**Clean Title**
- No major recorded damage on record
- May have minor incidents not severe enough to trigger a title change
- Higher resale value
- Lower risk for the buyer

**Rebuilt Title**
- Previously declared a total loss (accident, salvage, flood, etc.)
- Has since been repaired and passed state re-inspection to become road-legal again
- May still contain hidden issues from the original damage
- Lower resale value
- Higher risk, but significantly cheaper to acquire

User decision guide:
- Want lowest price → Rebuilt
- Want better long-term value / less risk → Clean

A tooltip or "What is Clean vs Rebuilt?" link must be available next to the toggle so users can read this inline without leaving the control.

### User selection
User can select Clean or Rebuilt as a preference.

### Important behavior
This is a **prioritization preference, not a hard filter**.

Meaning:
- Clean selected → prioritize clean options
- Rebuilt selected → prioritize rebuilt options
- if preferred type is unavailable, still show other valid results

### Title badges
Each of the 4 paths must visibly show the **actual** title type:
- Clean
- Rebuilt
- Unknown Title

This reflects the actual result, not just user preference.

### Rebuilt value logic

Where rebuilt pricing logic already exists, preserve it. When rebuilt is selected/detected, reduced value must be reflected where valid.

Path-specific notes:
- **Dealer**: use rebuilt reduction if supported by available logic/data
- **picknbuild**: use rebuilt reduction if already defined
- **Auction**: price already reflects what the listing is; do not fabricate new pricing
- **Private**: do not fabricate new pricing if no reliable model exists

---

Source: §3 Main Top Control Area, §4 Credit Score Input, §5 Clean / Rebuilt Logic
