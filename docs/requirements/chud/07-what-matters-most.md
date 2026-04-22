# "What Matters Most?" Control & Dynamic Recommendations

Add a top control component:

> What Matters Most? (Choose up to 2)

## Options

- Fast
- Lowest Cost
- Low Risk
- Hands-Off
- No Credit Required

## Selection rules

- max 2 selections
- after 2 selected → remaining options dim/disable
- deselection allowed

## Glow behavior

- 0 selected → all glow subtly
- 1 selected → selected stays highlighted, remaining glow
- 2 selected → glow stops
- deselect → glow resumes accordingly

## Recommendation text under selector

- After at least 1 selection → show recommendation line
- After 2 selections → stronger recommendation line

Format:

> Best match based on your priorities: [path] — [dynamic definition]

## Trade-off helper text

Examples:
- Fast + Hands-Off → Higher cost expected
- Lowest Cost → More work or risk required
- No Credit Required + Hands-Off → Higher upfront payment required

## Important logic corrections

**Do NOT treat:**
- Auction as Hands-Off
- Auction as Low Risk
- Private Seller as Low Risk

### Priority fixes

- Lowest Cost + Hands-Off → picknbuild
- Lowest Cost + Low Risk → picknbuild

## Dynamic Recommendation Definitions

Use format:

> [PATH NAME] — [SHORT, CONTEXT-AWARE DEFINITION]

Must be:
- short
- human
- benefit + trade-off
- include timeline where relevant

### picknbuild
Base: *picknbuild — No credit required, ~35% down, ready in 60–90 days*

### Dealer
Base: *Dealer — Same day delivery, but high interest and needs good credit*

### Auction
Base: *Auction — Lowest price, but unknown condition, high effort, ready ~1–2 weeks after win*

### Private Seller
Base: *Private Seller — Immediate purchase, but unknown seller/car and no protection*

Adjust based on:
- cash
- credit
- urgency
- priorities

## "See Cars You Can Get Today" Button

This button should only appear after the user selects 2 priorities in What Matters Most.

When clicked:
- automatically trigger Match Mode
- use current cash
- use current credit / no credit
- use location
- use title preference
- use urgency if already present
- show realistic cars the user can move on now

**Do not simply reload the page.**

---

Source: §13 "What Matters Most?", §14 Dynamic Recommendation Definitions, §15 "See Cars You Can Get Today"
