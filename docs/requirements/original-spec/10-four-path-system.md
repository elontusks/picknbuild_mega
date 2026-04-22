# The Four Path System

PicknBuild exposes exactly four acquisition paths for any vehicle. Each path has a mandatory set of fields that must be surfaced to the user. No path may be shown in a stripped-down form that hides the required data below.

---

## Dealer

The Dealer path represents acquisition through a franchised or independent dealership.

### Required Display Fields

The Dealer path must show:

- Down payment
- Monthly payment
- Estimated total cost
- Location
- Distance
- Timeline
- Risk
- Effort
- Whether credit is required

### Dealer Credit-Based Estimation (Mandatory)

If dealer financing details are unavailable, PicknBuild must estimate dealer cost based on the following inputs:

- User credit score input
- Dealer sticker price
- Dealer down payment requirement (if known)
- Estimated financing assumptions

The system must display the following outputs:

- Estimated monthly payment based on the user's credit
- Estimated total repayment for that user
- Comparison ranges for low / average / strong credit

This behavior is **mandatory**. The Dealer path may never fall back to showing only sticker price when financing details are missing — the credit-based estimate must always be rendered in its place.

---

## Auction (DIY)

The Auction path represents direct-to-auction acquisition where the user is the buyer of record and is responsible for post-sale logistics.

### Required Display Fields

The Auction path must show:

- Current bid
- Predicted final bid
- Fees
- Shipping based on location
- All-in cash estimate
- Timeline based on bid close and shipping
- Effort level
- Risk level

### Rule

**Auction path must never show raw bid alone without all-in estimate.** The current bid must always be accompanied by the predicted final bid, fees, shipping, and the all-in cash estimate so the user sees the true cost rather than the headline bid figure.

---

## picknbuild

picknbuild is the **core differentiated path** of the platform. It represents a managed sourcing, acquisition, and delivery service operated by PicknBuild on behalf of the user.

### Required Display Fields

The picknbuild path must show:

- 35% down payment clearly
- Financing options for 1, 2, 3, 4, and 5 years
- Monthly payment for each term
- Total repayment for each term
- Sourcing location
- Delivery estimate
- 30–90 day timeline
- Risk level
- Effort level

### Financing Terms Table

| Term | Monthly Payment | Total Repayment |
| ---- | --------------- | --------------- |
| 1 year  | Required | Required |
| 2 years | Required | Required |
| 3 years | Required | Required |
| 4 years | Required | Required |
| 5 years | Required | Required |

All five rows must be computed and displayed for every picknbuild listing.

### Customization Inputs

picknbuild must support customization inputs such as:

- Trim preference
- Features
- Condition level
- Repair level

### Title Type Toggle

picknbuild must support a toggle between:

- **Clean Title**
- **Rebuilt Title**

When the user flips the title type toggle, **pricing, risk, and totals must visibly change**. The toggle is not cosmetic — it must re-flow the displayed financials and risk level in real time.

### picknbuild Action Flow

The user must be able to choose either:

- **Start Now** — triggers a $1000 refundable deposit and starts the process.
- **Talk to Someone** — opens either a phone call or an in-platform message.

No other call-to-action is permitted in place of these two.

---

## Individual

The Individual path represents private-party acquisition from another end user.

### Required Display Fields

The Individual path must show:

- Cash price
- Negotiable indicator
- Location
- Timeline
- Risk
- Effort

### Rule

**Individuals must communicate through the platform.** No unrestricted direct contact sharing is allowed — phone numbers, emails, or off-platform handles must not be exposed in a way that bypasses PicknBuild's messaging system.

---

Source: §11

