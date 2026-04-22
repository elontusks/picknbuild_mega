# Dropped From Spec

Things originally in the chud spec that are being removed from the implementation. Kept here so the reasoning (and the hole it leaves) is traceable — don't re-introduce without revisiting this list.

---

## Dreamer / Delayer / Decider user states

**Originally in:** chud.md §2 Core User States, §12 Dreamer/Delayer/Decider messaging in "Your Best Path Right Now"

**What it proposed:** a three-state classification (Dreamer = unrealistic, Delayer = hesitating, Decider = ready) that internally adapted recommendation copy, CTA copy, emphasis/glow, and Your Best Path Right Now headlines. Not labeled in UI — internal behavior logic only.

**Why dropped:** classifying users into three emotional buckets is hard to implement reliably from the inputs we have (cash, credit, urgency, priorities) without guessing at intent, and it adds copy-branching surface area without clearly improving the recommendation. The recommendation engine already adapts to cash / credit / urgency / priorities — that does the real work. The user-state abstraction was sitting on top of that without adding signal.

**Replacement:** treat everyone as "the user." Your Best Path Right Now adapts its recommendation and CTA based on concrete inputs (cash vs. down payment gap, credit band, priorities, inventory) instead of a user-state label. Copy variants can still exist per input state, but they are not organized under Dreamer/Delayer/Decider.

**References already updated:**
- [00-overview.md](00-overview.md) — user-states section removed
- [COMPONENTS.md](COMPONENTS.md) — row renamed to "User-state messaging variants"

**Still references the idea (needs cleanup when we get there):**
- [06-best-path-right-now.md](06-best-path-right-now.md) — the Dreamer / Delayer / Decider messaging subsection

---

## Empty-state "no dead ends" system

**Originally in:** chud.md §8 Empty State Handling (also called out in §43 Final Product Goal)

**What it proposed:** whenever a search returned no strong result, the page would still render the four paths in estimated form, show estimated alternatives, surface a visible "Paste a deal" prompt, and always provide a next action. Intent: no page should make the user feel stuck.

**Why dropped:** the behavior is mostly redundant with how the rest of the product already works — the four-path display, link parser, and Match Mode are available from the top of the page regardless of whether a search matched anything. Building a dedicated "no dead ends" empty-state layer means maintaining a parallel estimated/fallback branch of the entire comparison UI, which is a lot of surface area for a case that mostly resolves itself when the user adjusts inputs or pastes a link.

**Replacement:** the normal comparison UI stays on screen. When results are thin, surface nothing special beyond the existing controls — if the user wants to compare a specific car they can paste it, if they want to widen results they can change inputs. We are not promising an always-on "estimated paths" rendering.

**References to clean up:**
- [00-overview.md](00-overview.md) — "No dead-end empty states" bullet in the Final Product Goal list
- [03-empty-states.md](03-empty-states.md) — the whole file; mark as dropped or delete
- [README.md](README.md) — the `03 — Empty states` index entry
- [COMPONENTS.md](COMPONENTS.md) — the "Empty state (no dead ends)" row in Four-Path Comparison

---

## What Matters Most selector (and its companion text slots)

**Originally in:** chud.md §13 "What Matters Most?" Control, §14 Dynamic Recommendation Definitions, §15 "See Cars You Can Get Today" Button

**What it proposed:** a top-of-page priority picker where the user selected up to 2 from {Fast, Lowest Cost, Low Risk, Hands-Off, No Credit Required}. Selections drove:
- a dynamic recommendation line (`Best match based on your priorities: [path] — [definition]`)
- trade-off helper text (e.g. "Fast + Hands-Off → Higher cost expected")
- a "See Cars You Can Get Today" CTA that only appeared after 2 selections

**Why dropped:** the recommendation engine already considers cost, risk, effort, timeline, credit, and cash from the intake inputs. Asking the user to pick 2 priorities on top of that is a second, redundant knob that adds UI complexity, copy-branching surface area, and an edge-case CTA. The recommendation result is meant to be obvious from the concrete inputs — we are not asking the user to re-express the same intent through labeled buckets.

**Replacement:** Your Best Path Right Now derives its recommendation directly from cash, credit, urgency, title preference, inventory, and location. No separate priority selector, no dynamic-recommendation line keyed to priority combinations, no trade-off helper text. The "See Cars You Can Get Today" shortcut goes away with it — users already have Match Mode and the four-path display for that same job.

**References to clean up:**
- [00-overview.md](00-overview.md) — "What Matters Most" bullet in the Final Product Goal list
- [06-best-path-right-now.md](06-best-path-right-now.md) — "What Matters Most priorities" in the recommendation-input list
- [07-what-matters-most.md](07-what-matters-most.md) — the whole file; mark as dropped or delete
- [README.md](README.md) — the `07 — What Matters Most` index entry

---

## Katzkin seat customization integration

**Originally in:** chud.md §91 Katzkin Seat Customization Integration (If Permitted)

**What it proposed:** ingest seat-design options from Katzkin.com (year/make/model/trim → design, color, Tek Stitch, heating/cooling, etc.) and surface them inside picknbuild / Add to Your Build / Seats so users could configure seats without leaving the platform. Included storage of structured seat data (SKU, vehicle compatibility, price/quote status) and an MVP fallback with manual upload + "match this seat style" request.

**Why dropped:** scope. Third-party ingestion is fragile (scraping risk, permission uncertainty, compatibility edge cases), and the payoff is a single customization category that already works without the integration — users can tick "Seats" as a $4,000 customization and attach reference images through "Add to Your Build." Structured seat configuration is a nice-to-have, not required for the core purchase flow.

**Replacement:** "Seats" stays in the picknbuild customization list ([11-picknbuild-customization-and-builds.md](11-picknbuild-customization-and-builds.md)) as a toggleable option. Users who want to specify a particular style use the existing Add to Your Build path — attach an image/link + note — and that becomes a build reference the platform handles manually.

**References to clean up:**
- [25-katzkin-seats.md](25-katzkin-seats.md) — the whole file; mark as dropped or delete
- [README.md](README.md) — the `25 — Katzkin seat integration` index entry
- [COMPONENTS.md](COMPONENTS.md) — already updated (Katzkin row removed; "Add to Your Build" row no longer references 25)

---

## "Build Your Deal" interactive calculator

**Originally in:** chud.md §92 "Build Your Deal" — Interactive Self-Calculation Layer

**What it proposed:** a multi-step self-calculation panel that sat after See Where You Stand. User enters the price range they've been seeing for the car → system adds tax/title/doc/optional shipping → user picks clean/rebuilt → user picks cash vs structured → if structured, picks term + credit → system shows the real all-in total, 35% down, monthly or biweekly. Closing line compared "what you started at" vs. "what it actually costs." Purpose: convert belief into understanding before pushing the user toward a conversion action.

**Why dropped:** it's the same job that See Where You Stand + the four-path display already do — show the user the real all-in number for each path given their inputs. Adding a separate guided calculator with its own step-by-step UI duplicates that logic in a second surface, and the "what you started at vs. what it actually is" reframing is a copy choice we can layer into the existing gap view if we ever want it. Not worth a standalone multi-step flow.

**Replacement:** See Where You Stand ([08](08-see-where-you-stand.md), [09](09-gap-view-paths.md)) already accepts cash + credit + term + clean/rebuilt and shows all-in cost, down, and biweekly/monthly per path. If we later want to anchor against the user's perceived price (the "lowest seen / highest seen" input), we add that as a small input in the gap view — not a separate calculator.

The "Build Your Deal" name also caused confusion with the picknbuild configurator page ([28](28-picknbuild-configurator.md)), which is what the user actually uses to purchase. Dropping the calculator frees that name up if we want it for the checkout page.

**References to clean up:**
- [26-build-your-deal-calculator.md](26-build-your-deal-calculator.md) — the whole file; mark as dropped or delete
- [README.md](README.md) — the `26 — Build Your Deal calculator` index entry
- [28-picknbuild-configurator.md](28-picknbuild-configurator.md) — the page is titled "BUILD YOUR DEAL (single-screen configurator)"; keep or rename, but we should pick one use of the phrase
- [10-picknbuild-pricing.md](10-picknbuild-pricing.md) — "Bi-weekly payment calculation" reference to 26 in COMPONENTS (already updated)
- [COMPONENTS.md](COMPONENTS.md) — already updated (calculator row removed; section renamed to "picknbuild Checkout Page"; Bi-weekly payment reference cleaned)

---

## Auction Service (paid "we bid for you" flow)

**Originally in:** chud.md §44–51 conversion clauses for Auction, §56–60 auction procurement fee + post-deposit, Star Package System Flow 2 (Auction Service page — §29-auction-service-flow.md)

**What it proposed:** a second checkout flow alongside picknbuild where the user paid the platform to bid on their behalf. Total fee $2,500 ($1,000 upfront non-refundable + $1,500 after winning). User wired their full max-bid amount; platform bid; if won, user paid winning bid + auction fees + shipping + the remaining $1,500; if not won, user could keep funds for another bid or request a refund of unused funds. Vehicles sold as-is, user responsible for all repairs, platform only liable for bid execution. Included "Start Auction Support" conversion CTA, "Auction Support Started" post-deposit status, and a dedicated Auction Service page.

**Why dropped:** narrows the platform's job. picknbuild is the paid platform-run flow; the Auction / DIY path is for users who want to go bid themselves. A middle tier where we bid on behalf of the user introduces a second paid product, a second checkout, a second agreement, and new operational liability (bidding windows, wire timing, repair blame, lost-auction refund logic). If someone wants a car sourced from auction with the platform handling execution, that's what picknbuild already does — picknbuild's sourcing is the real answer. "Auction" as a path stays in the four-path compare as DIY: we show the listing, we surface all-in cost context, and the user acts on it themselves.

**Replacement:** the Auction / DIY path stays as a **DIY comparison card** only. It shows the current bid, predicted final bid, fees, shipping, all-in estimate, risk, and timeline ([04-four-path-display.md](04-four-path-display.md), [16-auction-behavior.md](16-auction-behavior.md)). Its conversion action is "go act on this listing yourself" (link out or copy the info) — not a platform-run service. Users who want platform-handled sourcing pick picknbuild.

**Knock-on effects already applied to COMPONENTS.md:**
- Auction Service section removed
- "Auction / DIY path card" row no longer references 29
- Conversion-CTAs row no longer lists "Start Auction Support"
- Post-deposit-workflow row no longer lists "Auction Support Started"

**References to clean up:**
- [29-auction-service-flow.md](29-auction-service-flow.md) — the whole file; mark as dropped or delete
- [README.md](README.md) — the `29 — Auction service flow` index entry
- [18-conversion-flow.md](18-conversion-flow.md) — Auction conversion subsection still says service-based ("Start Auction Support", service-fee monetization); rewrite Auction as DIY link-out
- [20-deposit-and-post-deposit.md](20-deposit-and-post-deposit.md) — deposit ($2,500 auction procurement fee, "Auction Support Started" status, remaining auction payments) still documents the dropped flow; strip auction paths
- [21-guidance-checklist.md](21-guidance-checklist.md), [22-guidance-inspection.md](22-guidance-inspection.md), [23-guidance-pricing.md](23-guidance-pricing.md) — Auction coverage stays (still a DIY comparison path), but any phrasing implying platform-run bidding needs rewording
