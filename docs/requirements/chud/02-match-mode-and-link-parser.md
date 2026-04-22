# Match Mode & Link Parser

## Match Mode

Keep Match Mode.

It must continue to work with:
- top controls
- four-path comparison
- parsed link objects
- estimated fallback states
- "See Cars You Can Get Today"

If explanation is needed in the UI, keep it simple.

## "Already Found a Car? Compare It Here" — Link Parser

Add/preserve a paste-a-link input:

> Already found a car? Compare it here

### Behavior

User pastes a listing URL.

System attempts to parse:
- title
- price
- images
- year / make / model if available
- basic metadata from URL/page

### Internal object creation
Create an internal listing object and run it through the four-path display.

### Fallback
If parsing fails, allow manual fallback input:
- title
- price
- image

### Positioning

This is a **power tool**, not a fallback for a broken product.

It should feel like:

> Bring any deal here and compare it.

---

Source: §6 Match Mode, §7 Link Parser
