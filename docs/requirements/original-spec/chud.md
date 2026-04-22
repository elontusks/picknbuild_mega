# PicknBuild Platform — Final Updated Build Outline



Build on top of the current platform. Preserve the existing structure unless a specific addition below requires extending it. Do not redesign the product from scratch. The goal is to capture the full current vision, logic, wording, and interaction model in one place so nothing gets missed.



This is not just a listing site.  

This is a decision platform / reality engine for getting a car.



---



# 1. Core Product Model



The platform compares 4 ways to get a car:



1. Dealer

2. Auction / DIY

3. pick n build

4. Private Seller



The platform is not a simple marketplace and not just a listing site. It is the system that helps people understand how to get a car, not just which car to click on.



The user should be able to compare all 4 paths in one place and not need to leave the platform to understand their options.



Each vehicle or parsed deal should feed into the same four-path comparison system.



---



# 2. Core User States (Three Ds)



The platform should subtly adapt to 3 user states:



## Dreamers

- unrealistic expectations

- large mismatch between desired car and current financial reality

- need reality + direction



## Delayers

- comparing and hesitating

- close enough to buy but unsure

- need clarity + confidence



## Deciders

- realistic inputs

- high intent

- ready to act

- need speed + certainty



This state system should influence:

- recommendation copy

- CTA copy

- emphasis / glow

- “Your Best Path Right Now”

- “See Where You Stand”



Do NOT explicitly label users as Dreamer / Delayer / Decider in the UI.  

This is internal behavior logic.



---



# 3. Main Top Control Area



The main control area should support the core search/comparison experience and newer features.



Include support for:



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

- “Already have a car? Get an estimate to upgrade or fix it”

- “Already found a car? Compare it here”

- “What Matters Most? (Choose up to 2)”



Do not remove existing controls. Extend them.



---



# 4. Credit Score Input



## Credit score input

- user can enter a score manually



## No Credit toggle

Add a simple toggle under credit score:



No Credit



When checked:

- treat as highest-risk case for pick n build

- Dealer should become unavailable / not approved

- Dealer financing breakdown should not show normal financing output

- pick n build should still function



Dealer unavailable state:

- “Most likely not approved”

- optional subtext: “Dealer financing usually requires approval”



---



# 5. Clean / Rebuilt Logic



## User selection

User can select Clean or Rebuilt as a preference.



## Important behavior

This is a prioritization preference, not a hard filter.



Meaning:

- Clean selected → prioritize clean options

- Rebuilt selected → prioritize rebuilt options

- if preferred type is unavailable, still show other valid results



## Title badges

Each of the 4 paths must visibly show the actual title type:

- Clean

- Rebuilt

- Unknown Title



This reflects the actual result, not just user preference.



## Rebuilt value logic

Where rebuilt pricing logic already exists, preserve it.

When rebuilt is selected/detected, reduced value must be reflected where valid.



Path-specific note:

- Dealer: use rebuilt reduction if supported by available logic/data

- pick n build: use rebuilt reduction if already defined

- Auction: price already reflects what the listing is; do not fabricate new pricing

- Private: do not fabricate new pricing if no reliable model exists



---



# 6. Match Mode



Keep Match Mode.



It must continue to work with:

- top controls

- four-path comparison

- parsed link objects

- estimated fallback states

- “See Cars You Can Get Today”



If explanation is needed in the UI, keep it simple.



---



# 7. “Already Found a Car? Compare It Here” Link Parser



Add/preserve a paste-a-link input:



Already found a car? Compare it here



## Behavior

User pastes a listing URL.



System attempts to parse:

- title

- price

- images

- year / make / model if available

- basic metadata from URL/page



## Internal object creation

Create an internal listing object and run it through the four-path display.



## Fallback

If parsing fails:

- allow manual fallback input

- title

- price

- image



## Positioning

This is a power tool, not a fallback for a broken product.



It should feel like:

> Bring any deal here and compare it.



---



# 8. Empty State Handling



No dead ends anywhere.



If no strong result exists:

- still show the four paths in estimated form

- show estimated alternatives

- show visible “Paste a deal” prompt

- always give a next action



Goal:

No page should make the user feel stuck.



---



# 9. Four-Path Structure and Messaging



## Dealer

Headline / label:

Fastest Access



Support text:

Drive away quickly with dealer financing.



## Auction / DIY

Headline / label:

Lowest Price



Support text:

Insurance and salvage auctions. Handle bidding and repairs yourself.



## pick n build

Headline / label:

No Credit Required



Support text:

No searching, no repairs, no credit or interest.



Branding rule:

- display as pick n build

- all lowercase

- only the n is red

- not the K



## Private Seller

Headline / label:

Lowest Cost



Support text:

Buy directly from the seller. Inspect and negotiate yourself.



Keep these simple and literal.



---



# 10. Path-Specific Sponsor Boards



Convert support/service sections into future sponsor boards.



These are not generic ads. They are structured sponsor zones by path.



## Dealer Support

Description:

Warranty, insurance, GAP coverage, and financing support



Secondary line:

Businesses can place services here



## DIY Support

Description:

Parts, tools, transport, and repair services



Secondary line:

Businesses can place services here



## pick n build Protection

Description:

Insurance, warranty, and protection services



Secondary line:

Businesses can place services here



## Private Sale Protection

Description:

Inspection, payment protection, and title services



Secondary line:

Businesses can place services here



Keep compact and integrated. No banner-ad treatment.



---



# 11. “Your Best Path Right Now” Component



Add a persistent recommendation component above the 4 paths.



## Header

Your Best Path Right Now



Subtext:

Based on your cash, credit, and goals — this is your smartest move.



## Behavior

- slightly elevated card

- subtle pulsing glow

- always visible / optionally sticky

- updates instantly when inputs change



## Outputs

- recommended path

- short reason why

- supporting bullets

- alternatives

- primary CTA



## Critical rule

This component must feel accurate.  

If it feels wrong even once, trust breaks.



## It must be neutral

Do NOT default to pick n build.



The recommendation must consider:

- available cash

- credit / no credit

- urgency

- title preference

- inventory availability

- total cost

- barrier to entry

- effort

- risk

- timeline

- What Matters Most priorities



---



# 12. Dreamer / Delayer / Decider Messaging in “Your Best Path Right Now”



## Dreamer state

Headline:

You’re not ready for this car yet — here’s your best move



Subtext:

Based on your current cash and credit, this is what you can realistically get today.



Buttons:

- See Cars You Can Get Today

- See Where You Stand



## Delayer state

Headline:

This is your best option



Subtext:

You’ve compared all paths — this gives you the best balance of cost, risk, and approval.



CTA:

- Move forward with this option



## Decider state

Headline:

You’re ready — this is your move



Subtext:

Everything checks out. This option fits your situation.



CTA:

- Start Now

- Secure Your Car



---



# 13. “What Matters Most?” Control



Add a top control component:



What Matters Most? (Choose up to 2)



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

After at least 1 selection:

- show recommendation line



After 2 selections:

- stronger recommendation line



Format:

Best match based on your priorities: [path] — [dynamic definition]



## Trade-off helper text

Examples:

- Fast + Hands-Off → Higher cost expected

- Lowest Cost → More work or risk required

- No Credit Required + Hands-Off → Higher upfront payment required



## Important logic corrections

Do NOT treat:

- Auction as Hands-Off

- Auction as Low Risk

- Private Seller as Low Risk



Priority fixes:

- Lowest Cost + Hands-Off → pick n build

- Lowest Cost + Low Risk → pick n build



---



# 14. Dynamic Recommendation Definitions



Use format:



[PATH NAME] — [SHORT, CONTEXT-AWARE DEFINITION]



Must be:

- short

- human

- benefit + trade-off

- include timeline where relevant



## pick n build

Base:

pick n build — No credit required, ~35% down, ready in 60–90 days



## Dealer

Base:

Dealer — Same day delivery, but high interest and needs good credit



## Auction

Base:

Auction — Lowest price, but unknown condition, high effort, ready ~1–2 weeks after win



## Private Seller

Base:

Private Seller — Immediate purchase, but unknown seller/car and no protection



Adjust based on:

- cash

- credit

- urgency

- priorities



---



# 15. “See Cars You Can Get Today” Button



This button should only appear after user selects 2 priorities in What Matters Most.



When clicked:

- automatically trigger Match Mode

- use current cash

- use current credit / no credit

- use location

- use title preference

- use urgency if already present

- show realistic cars the user can move on now



Do not simply reload the page.



---



# 16. Rename “Plan for Your Goal” to “See Where You Stand”



Replace:

Plan for Your Goal



With:

See Where You Stand



Keep the inside functionality, but rename the entry point everywhere it appears.



---



# 17. “See Where You Stand” Gap View



This is an additive layer/panel/modal/drawer.



Do NOT replace the page.

Do NOT remove anything else.



## Core purpose

Show the user:

- what they can realistically afford

- what they want

- the gap between the two

- how to move forward



## Important rule

ALL pricing shown in this view must be:



Total Cost / All-in Price



Never just raw vehicle price.



---



# 18. “See Where You Stand” Path Toggle + Auto-Cycle



Inside the gap view only, add a path toggle:



- Dealer

- Auction / DIY

- pick n build

- Private Seller



When the panel opens:

- automatically cycle through paths

- wait briefly on each

- continue looping



If user manually selects one:

- stop auto-cycle

- stay on that path until panel closes/reopens



Purpose:

- make it obvious that gap changes by path



---



# 19. “See Where You Stand” Structure



Inside the panel, preserve these sections:



## 1. What You Can Do Today

Show path-specific all-in reality.



## 2. Your Target

Show target as total cost / all-in price.



Add line under this:

Final cost depends on the path and term you choose.

or equivalent simple wording.



## 3. The Gap

Show the difference between user’s current position and selected path reality.



## 4. How to Get There

Simple next-step guidance.



---



# 20. “See Where You Stand” — No Ranges for Dealer and pick n build



Do NOT show ambiguous ranges for Dealer or pick n build.



No unclear values like:

- $6,400 – $17,000



Every number must be clearly labeled and tied to the selected term.



---



# 21. Dealer + pick n build Term Selector in “See Where You Stand”



Inside Dealer and pick n build only, add:



Choose Your Term



Show only valid/available terms, plus Cash if available.



Examples:

- Dealer: Cash, 3, 4, 5, 6 years

- pick n build: Cash, 1–5 years

- only show what is actually available



No unavailable terms.



Always have a selected term:

- default to Cash if available

- otherwise shortest available term



---



# 22. Dealer Logic in “See Where You Stand”



## If term = Cash

Hide:

- Down Payment (Estimated)

- Monthly payment



Show:

- Total Cost (All-in)



## If financed term selected

Show:

- Down Payment (Estimated)

- Total Cost (All-in)

- Estimated Monthly Payment



Dealer notes:

- approval required

- good credit usually needed

- higher interest over time

- same-day is possible if approved



Gap should reflect:

- approval dependency

- estimated down payment

- total cost

- monthly payment



---



# 23. pick n build Logic in “See Where You Stand”



## If term = Cash

Hide:

- Down Payment (35%)

- Biweekly payment



Show:

- Total Cost (All-in)



## If financed term selected

Show:

- Down Payment (35%)

- Total Cost (All-in)

- Estimated Biweekly Payment



### Critical down payment rule

For pick n build:

- down payment = 35% of TOTAL ALL-IN COST for the selected term



Not vehicle price alone.



### Minimum payment rule

pick n build has a minimum payment threshold equivalent to $500/month.

Only show terms that satisfy the business rule.



Terms may vary case by case.

Do not hardcode all terms universally.



Gap should reflect:

- down payment gap

- total cost gap

- biweekly payment at selected term



---



# 24. Auction Logic in “See Where You Stand”



Auction should not behave like Dealer or pick n build.



Show:

- Current Bid

- Estimated Total Cost

- note that repairs / transport / unknowns may change final total



No down payment section.



Barrier to entry is:

- cash

- transport

- repairs

- unknown condition



Timeline:

- approximately 1–2 weeks after win, varies



---



# 25. Private Seller Logic in “See Where You Stand”



Keep this simplest.



Show:

- Price (Cash Required)



Possible note:

- you pay seller directly

- unknown seller / unknown car condition

- no built-in protection



No financing, no down payment, no term selector.



Timeline:

- immediate / same day if deal works out



---



# 26. Barrier to Entry / Path Reality Lines in “See Where You Stand”



Each path should clearly show what the real barrier is.



## Dealer

Barrier to entry:

- approval + down payment + credit



## Auction

Barrier to entry:

- cash + repairs + transport + unknowns



## pick n build

Barrier to entry:

- ~35% down + build time



## Private Seller

Barrier to entry:

- full cash + your own inspection / risk



Add a short line:

What this path really requires: ...



Keep plain and blunt.



---



# 27. Pick n Build Core Logic



pick n build must support:

- risk-based pricing

- term-based risk

- bi-weekly payments

- customization

- build requests / links / files

- “already have a car” estimate flow



---



# 28. pick n build Credit Risk Formula



Use:

- 850 = 15%

- 580 = 45%

- 580 and below = 45%

- 850 and above = 15%



Formula:

base_risk_percentage = 45 - ((credit_score - 580) / 270 * 30)



Bounds:

- min 15%

- max 45%



This is the full 5-year risk.



---



# 29. pick n build Term Risk Logic



Selected term determines portion of full risk:



term_risk_percentage = base_risk_percentage × (selected_years / 5)



Example for 500 score:

- 1 year = 9%

- 2 years = 18%

- 3 years = 27%

- 4 years = 36%

- 5 years = 45%



Must update correctly whenever:

- credit changes

- term changes



No stuck values.



---



# 30. pick n build Total Price Formula



Use this order:



1. vehicle_price = base_price + tax + fees

2. risk_amount = vehicle_price × term_risk_percentage

3. subtotal_price = vehicle_price + risk_amount

4. customization_total = sum(selected_customizations)

5. total_price = subtotal_price + customization_total

6. down_payment = total_price × 0.35

7. remaining_balance = total_price - down_payment



Use existing rebuilt logic before risk if already connected.



---



# 31. pick n build Payment Cadence



pick n build uses bi-weekly payments, not monthly.



Formula:

- number_of_biweekly_payments = selected_years × 26

- biweekly_payment = remaining_balance / number_of_biweekly_payments



Examples:

- 1 year = 26

- 2 years = 52

- 3 years = 78

- 4 years = 104

- 5 years = 130



Hide biweekly payment when Cash selected.



---



# 32. pick n build Customizations



Current options:

- Wrap — $4,000

- Seats — $4,000

- Starlight — $1,500

- Paint — $3,500



Each:

- toggle on/off

- visually selected when active

- multiple selectable

- included in total pricing



---



# 33. pick n build “Add to Your Build”



Allow users to:

- paste links

- upload image

- upload file

- add notes



Use cases:

- screens

- accessories

- wrap references

- lighting

- interior requests

- parts



Store/display as build references.



---



# 34. “Already Have a Car?” Estimate Flow



Secondary CTA in top control area:



Already have a car? Get an estimate to upgrade or fix it



This is NOT trade-in.



## Inputs

Primary:

- VIN



Fallback:

- year

- make

- model

- mileage

- trim



Then allow:

- Seats

- Wrap

- Paint

- Starlights

- Repairs

- Add to Your Build

- links

- files

- images

- notes



Output:

- estimate / estimate request flow for existing vehicle work



---



# 35. Trade-In — Dealer and pick n build



Separate from “Already have a car”.



Trade-in applies to:

- Dealer

- pick n build



Flow:

- enter VIN

- system generates estimated trade-in value

- Clean / Rebuilt toggle

- rebuilt reduces value

- trade-in value reduces total before financing



Do not apply to:

- Auction

- Private



---



# 36. Dealer APR and Financing Logic



APR tiers:

- 720–850 → 12%

- 621–719 → 19.5%

- 0–620 → 27%



If below threshold:

- show not approved state



Changing term must update:

- estimated down payment

- loan amount

- estimated monthly

- estimated total paid

- interest paid



APR cost must be reflected in total paid.



---



# 37. Dealer / Seller / External Signal Flows



## Dealer

When user interacts with dealer listing:

- create lead signal

- support dealer re-entry / response through platform workflow



## Private Seller

When user expresses interest:

- seller gets a message/signal

- seller is prompted to join or continue in platform

- this pulls external supply into internal flow



## External listing conversion loop

- user finds external deal

- user compares it in PicknBuild

- seller/dealer gets signal

- seller/dealer returns into platform

- system internalizes supply over time



---



# 38. Auction / DIY Core Behavior



Show:

- current bid

- estimated final bid / estimated total

- fees

- tax

- repairs unknown or estimated

- effort level

- risk level

- timeline



Auction must never show raw bid alone without contextual cost.



---



# 39. Path Comparison Detail Requirements



At minimum, path cards should correctly represent:

- path label

- pricing style

- core trade-off

- sponsor board

- title badge

- relevant term/payment/risk logic

- timeline



---



# 40. Live Update Requirement



Wherever connected, update instantly when:

- credit score changes

- no credit toggle changes

- clean / rebuilt changes

- trade-in changes

- selected term changes

- customizations change

- parsed listing changes

- vehicle inputs change

- priorities change



No unnecessary search button for recalculations.



---



# 41. What Not to Change



Do not change unless explicitly required:

- overall platform design direction

- four-path structure

- unrelated mechanics

- existing layout outside additive components / text corrections



This is refinement and expansion, not a total rebuild.



---



# 42. Developer Priority Order



1. pick n build term risk fix

2. Dealer APR / total paid fix

3. Credit / no credit behavior

4. What Matters Most logic fixes

5. Your Best Path Right Now accuracy

6. See Where You Stand gap view fixes

7. Dealer/pick n build term selector inside gap view

8. Trade-in VIN behavior

9. Already-have-a-car estimate flow

10. Link parser / internal listing object

11. Dealer/private signal return flows

12. Sponsor board cleanup

13. Build attachments / files / links polish

14. Empty state no-dead-end logic



---



# 43. Final Product Goal



The final user experience should feel like this:



- user enters the platform

- user puts in what they want

- user puts in the truth

- platform shows where they actually stand

- platform forces trade-offs

- platform shows every real path in one place

- platform tells them their best path right now

- if they already found a car, they compare it here

- if they already own a car, they get an estimate here

- if they want customization, they request it here

- if they interact with external supply, that supply can be pulled back into platform flow

- no path feels like a dead end

- no number feels unclear

- no excuse remains unclear because all real options are visible



---



## 44. Conversion and Checkout Flow



The platform should treat conversion as a two-step process:



1. Decision Conversion  

2. Payment Conversion  



Decision conversion happens when the user clearly understands their situation and selects a path.



Payment conversion happens when the user commits to executing that path.



Do not introduce payment before clarity is established.



---



## 45. Path-Based Conversion Points



Each path has a different conversion behavior and should not be forced into a single checkout model.



---



### Dealer Conversion



Dealer is not a direct checkout path in most cases.



Primary conversion action:

- Contact Dealer

- Get This Deal

- Continue with Dealer



Behavior:

- user action creates a lead signal

- dealer is notified through platform

- dealer re-engages through platform workflow



Platform monetization:

- dealer-side (lead, subscription, or unlock model)



Do not force full payment checkout on Dealer path.



---



### Auction / DIY Conversion



Auction is a service-based conversion.



Primary conversion action:

- Start Auction Support

- Get Help With This Auction



Behavior:

- user commits to using platform assistance

- service workflow begins



Platform monetization:

- service fee for auction support, sourcing, logistics, or coordination



Do not treat auction as a direct product checkout.



---



### pick n build Conversion



pick n build is the primary direct checkout path.



Primary conversion action:

- Start Now

- Secure Your Build

- Place Deposit



Behavior:

- user has already seen:

  - total cost

  - down payment

  - term

  - biweekly payment

  - timeline

- user commits to execution



Checkout step:

- collect refundable deposit (example: $1,000 if already used in system)



After checkout:

- build process begins

- sourcing / confirmation workflow starts



This is the main buyer-to-platform payment flow.



---



### Private Seller Conversion



Private Seller is initially an intent-based conversion.



Primary conversion action:

- Message Seller

- Show Interest



Behavior:

- user expresses interest

- seller receives signal

- seller is brought into platform flow



Future monetization (optional):

- inspection

- payment protection

- title handling

- escrow services



Do not force immediate checkout on private seller path.



---



## 46. Payment Timing Rule



Payment must only appear after:

- path is selected

- costs are visible

- terms are selected (if applicable)

- user understands the gap

- user sees payment structure (monthly or biweekly if applicable)



No early checkout prompts.



---



## 47. Execution CTAs by Path



Each path must have a clear execution action:



- Dealer → Contact / Continue with Dealer  

- Auction → Start Auction Support  

- pick n build → Start Now / Place Deposit  

- Private → Message Seller  



These actions should feel like the next logical step, not a forced checkout.



---



## 48. Post-Conversion State



After a user completes a conversion action, the platform should not end the experience.



It should transition into a visible progress state.



---



### pick n build Post-State



- deposit received

- build started

- next steps visible

- timeline visible

- ability to track progress



---



### Auction Post-State



- support initiated

- next steps visible

- tracking or coordination state



---



### Dealer Post-State



- lead sent

- awaiting dealer response

- user can continue interaction through platform



---



### Private Seller Post-State



- seller notified

- connection in progress

- seller prompted to enter platform flow



---



## 49. Platform Monetization Model



The platform should support both:



### Buyer-side revenue

- pick n build deposit

- auction support fees

- optional protection / inspection services



### Seller-side revenue

- dealer lead access or subscriptions

- promoted listings (future)

- sponsor boards (future)



---



## 50. Conversion Philosophy



The platform should follow this rule:



- Do not ask for money before the user understands their situation  

- Do not push checkout before showing all paths  

- Do not interrupt comparison with payment prompts  



The correct order is:



1. Input (cash, credit, preferences)  

2. Compare all paths  

3. Show best path  

4. Show gap and reality  

5. Allow user to choose  

6. Then allow payment / execution  



---



## 51. Final Conversion Principle



The system should feel like:



- the user decides first  

- the platform executes second  



The user should never feel like they are being pushed into payment.



They should feel like:



> they understand their options, and now they are ready to move forward



---



---



## 52. Commitment Flow, Agreements, and Payment Execution



The platform must support a structured commitment flow for paths that require execution before final vehicle assignment.



This applies primarily to:

- pick n build

- Auction / DIY (when using platform support)



---



## 53. Commitment Before Vehicle Lock



Important concept:



Users are NOT committing to a specific VIN at this stage.



They are committing to:

- vehicle specifications

- budget range

- condition (clean or rebuilt)

- path selected (pick n build or auction support)

- platform execution of sourcing and fulfillment



---



## 54. Spec-Based Commitment Definition



User commitment must clearly include:



- Make

- Model

- Year range

- Mileage range

- Trim (if specified)

- Condition (Clean / Rebuilt)

- Selected customizations

- Add-ons / build requests

- Credit score (as entered)

- Available cash (as entered)

- Selected term (if applicable)



If the exact vehicle is not secured:

- platform will source a comparable vehicle within these specs



Clear statement must exist:



> “You are committing to the specs above, not a specific vehicle.  

If a specific vehicle becomes unavailable, we will source a comparable one.”



---



## 55. Required Agreement Form



Before payment, the user must complete a structured agreement form.



This form must include:



### Acknowledgements



- I understand I am not reserving a specific VIN

- I am committing to specifications listed above

- I understand comparable vehicles may be sourced

- I understand timelines may vary

- I understand pricing is based on current inputs and may adjust if inputs change



### Financial Acknowledgements



- I understand the $1,000 deposit is required to begin

- I understand how the deposit is applied

- I understand refund conditions (if any)

- I understand additional payments will be required



### Path-Specific Clauses



#### pick n build:

- build timeline acknowledgement (e.g. 60–90 days)

- customization acknowledgement

- risk/term acknowledgment



#### Auction:

- unknown condition acknowledgment

- responsibility acknowledgment (if DIY elements apply)

- timeline variability acknowledgment



---



## 56. Deposit Structure



The platform should require a $1,000 deposit before execution begins.



### Behavior



- deposit is required to proceed

- deposit is tracked in system

- deposit is applied toward:

  - pick n build total cost

  - OR auction procurement fee



### Auction note



Auction procurement fee:

- total = $2,500

- deposit = $1,000 applied toward it

- remaining = $1,500 due later



---



## 57. Payment Methods and Flow



System should support:



### Initial Payment

- $1,000 deposit

- processed through integrated payment system (e.g. Stripe or equivalent)



---



### Remaining Payments



Depending on path:



#### pick n build:

- remaining down payment OR full cash amount

- OR structured payment plan



#### Auction:

- remaining procurement fee

- auction funding (cash required)



---



### Payment Methods



Support:

- card (for deposit)

- ACH / bank transfer

- wire instructions



If wiring is used:

- provide clear instructions inside platform

- track payment status



---



## 58. Full Payment Tracking System



The platform must track all payment stages:



- deposit received

- remaining balance due

- payment method selected

- payment status (pending / received / confirmed)

- timestamps



User should always be able to see:



- what they paid

- what is remaining

- what is next



---



## 59. Post-Deposit Workflow



Immediately after deposit:



### pick n build



- status: “Build Started”

- sourcing begins

- vehicle matching begins

- timeline shown

- next steps shown



---



### Auction



- status: “Auction Support Started”

- bidding / sourcing workflow begins

- user notified of next actions



---



## 60. No-Manual Handling Goal



System should be built so:



- all forms are digital

- all agreements are signed in-platform

- all payments are tracked in-platform

- all steps are visible to the user



Goal:



> No manual chasing, no external tracking, no disconnected communication.



---



## 61. User Dashboard (Post-Commitment)



After deposit, user should enter a tracked state:



Display:



- current status

- selected path

- selected specs

- payment summary

- next required action

- timeline / progress



This should feel like:



> a live order / build / process dashboard



---



## 62. Key Principle



The system should ensure:



- clarity before commitment

- commitment before execution

- execution is tracked

- payments are transparent

- no ambiguity about what the user agreed to



---



## 63. Final Behavior Summary



Before deposit:

- user explores

- compares

- understands



At deposit:

- user commits to specs

- signs agreement

- enters execution flow



After deposit:

- system takes over

- process becomes structured and trackable



---



## 64. Final Rule



The user should feel:



> “I know exactly what I’m committing to,  

and I can see everything happening after I pay.”



---



Add this to the end so it continues naturally:



⸻



65. Guidance Layer: Checklist, Inspection Partner, and Pricing Guidance



The platform should not stop at comparison.

It must also help the user execute safely.



This does NOT mean adding generic articles or static educational content.



It means the platform should provide structured decision support that reduces mistakes, uncertainty, and emotional buying.



The guidance layer should include:

• Checklist

• Inspection Partner

• Pricing Guidance



These should work as execution-support tools inside the platform experience.



⸻



66. Checklist = Step-by-Step Decision Enforcement



Checklist does not mean a blog post, article, or downloadable PDF.



Checklist means:



a live, step-by-step buying flow that helps the user know what to do, what to verify, and when to stop.



The purpose is to reduce:

• bad decisions

• scam exposure

• missed details

• emotion-based choices

• user paralysis



The checklist should feel like:



“Here is exactly what to do next.”



⸻



67. Checklist Structure



The checklist should be stage-based and tied to the actual path the user is considering.



Suggested stages:



1. Before Contacting the Seller / Source



Examples:

• Is the price within market range?

• Is the VIN available?

• Is the title status known?

• Is the listing information complete enough to proceed?



If critical information is missing, the platform should flag that clearly.



⸻



2. Before Meeting / Before Committing



Examples:

• Ask for maintenance records

• Ask for cold start video

• Ask whether the title is clean or rebuilt

• Confirm seller identity or source legitimacy

• Confirm no lien if applicable



The platform may support copy-ready prompts/messages for this stage.



⸻



3. During Inspection / Evaluation



Examples:

• Check engine sound

• Check for leaks

• Check braking response

• Check dashboard lights

• Check body panel mismatch

• Check signs of previous damage or repair



Where possible, these can include:

• visual references

• short explanations

• red-flag indicators



⸻



4. Before Payment / Final Commitment



Examples:

• Title matches seller identity

• Bill of sale is ready

• Agreed amount is confirmed

• No unresolved title or condition issue remains

• User understands exact payment structure



If a critical condition fails, platform should clearly indicate:



Do not proceed yet.



⸻



68. Checklist Behavior Rules



Checklist must be:

• interactive

• tied to the selected path

• tied to the selected vehicle or parsed deal where applicable

• useful in real time

• simple enough for beginners

• not overwhelming



Checklist should function as decision support, not content clutter.



Important principle:



Checklist is not information for information’s sake.

It is a system that helps users avoid making the wrong move.



⸻



69. Path-Specific Checklist Adaptation



Checklist should adapt by path.



Dealer



Focus:

• approval readiness

• financing clarity

• APR / total paid understanding

• title status

• dealer legitimacy

• fees and add-ons



Auction / DIY



Focus:

• auction rules

• unknown condition

• transport

• repair assumptions

• bid discipline

• hidden total cost exposure



pick n build



Focus:

• spec confirmation

• condition selection

• term and payment understanding

• customization confirmation

• commitment acknowledgment

• timeline understanding



Private Seller



Focus:

• identity verification

• title verification

• inspection

• cash handling safety

• lien risk

• condition uncertainty



⸻



70. Inspection Partner = Trusted Third-Party Verification



Inspection Partner means:



a trusted verification layer that helps the user confirm the real condition of a vehicle instead of relying only on the seller’s version.



This is especially valuable for:

• Private Seller

• Auction / DIY

• external parsed listings

• higher-risk dealer inventory if needed



The inspection layer exists to answer the user’s main fear:



“How do I know this is real, and how do I know I’m not getting screwed?”



⸻



71. Inspection Partner Modes



The platform should be able to support inspection in multiple forms over time.



Option A — On-Demand Inspection



User can request an inspection for a vehicle.



Flow:

• user selects vehicle or pasted deal

• user clicks a verification / inspection action

• inspection request is initiated

• result returns to platform



Possible output:

• condition summary

• visible issues

• photos

• repair notes

• estimated repair cost range

• pass / caution / fail style recommendation



⸻



Option B — Pre-Verified Inventory



Some inventory or deals may already have completed inspection data attached.



These can display signals such as:

• inspected

• verified

• condition reviewed

• issues disclosed



This should create a trust advantage inside the platform.



⸻



Option C — Lightweight / Remote Review



For earlier-stage launch or MVP, the platform may support lighter verification options such as:

• expert walkthrough review

• submitted photo/video review

• remote inspection guidance

• partner review of seller-provided materials



This allows the inspection concept to exist before a full field-inspection network is built.



⸻



72. Inspection Partner Output Requirements



Inspection results should be shown in a clear and practical way.



Possible outputs:

• condition summary

• issue list

• severity indicators

• estimated repair impact

• recommendation to proceed / proceed carefully / avoid

• confidence level if limited information is available



Inspection must support decision-making, not create more confusion.



⸻



73. Pricing Guidance = “Is This Actually a Good Deal?”



Pricing Guidance means:



the platform helps the user understand whether the vehicle, path, or offer makes financial sense.



This should answer:

• Is this overpriced?

• Is this fair?

• What should I expect to pay?

• What is the real total cost?

• What would be a smarter offer or better path?



This is not just “market price.”

It must be contextual to the selected path.



⸻



74. Pricing Guidance Requirements



Pricing Guidance should help show:

• expected market range where reliable

• whether current price is low / fair / high

• total cost context, not raw sticker alone

• impact of rebuilt title where applicable

• impact of fees, transport, repairs, interest, and risk

• suggested negotiation anchor if relevant



Examples:

• This is above market

• This is fair for the mileage and title type

• The raw price looks low, but the all-in cost is not

• This auction bid is still attractive, but repairs may erase the advantage



⸻



75. Pricing Guidance by Path



Dealer



Focus on:

• sale price vs total financed cost

• APR effect

• fees and add-ons

• monthly and total-paid reality



Auction / DIY



Focus on:

• current bid vs estimated total cost

• fee impact

• repair uncertainty

• transport costs

• risk of false “cheapness”



pick n build



Focus on:

• total all-in cost

• term impact

• risk-based pricing effect

• customization cost effect

• down payment and biweekly payment clarity



Private Seller



Focus on:

• asking price vs fair value

• title type

• mileage

• condition uncertainty

• inspection-adjusted value if available



⸻



76. Core Principle: Personalized Guidance, Not One-Size-Fits-All Advice



The platform should not present one universal answer such as:

• always buy cash

• always avoid dealers

• always go private

• always go auction



The market is fragmented because different users have different:

• risk tolerance

• financial flexibility

• trust thresholds

• urgency

• knowledge level



The platform must reflect that.



Important principle:



The goal is not to tell every user the same answer.

The goal is to show each user what makes the most sense for them.



⸻



77. Guidance Should Adapt to Buyer Type and Risk Tolerance



The platform should help users based on who they are, not just based on what cars exist.



Examples:



Beginner / Risk-Averse User



Should see stronger emphasis on:

• verification

• inspection

• safer paths

• fewer unknowns

• higher-confidence actions



Price-Maximizing / Higher-Risk User



May tolerate:

• auctions

• rebuilt units

• DIY effort

• unknowns for better price



Hands-Off User



Should be guided toward:

• cleaner execution paths

• fewer moving parts

• lower user burden

• more structured flow



This reinforces the idea that the platform is a decision engine, not just inventory display.



⸻



78. Execution Support Layer Positioning



The platform should feel like:

• compare the paths

• understand the trade-offs

• see where you stand

• get guidance on what to do next

• verify before acting

• move forward with confidence



The user should not feel like they must leave the platform to:

• figure out what to ask

• figure out what to inspect

• figure out if the price is good

• figure out whether the deal is safe



⸻



79. MVP Interpretation of Guidance Layer



For MVP, these features do not need to begin as fully automated systems.



They can begin in lighter forms if needed, as long as the product logic is preserved.



Examples:



Checklist MVP

• structured on-screen stage flow

• simple completion states

• path-based question prompts

• critical warnings when key data is missing



Inspection MVP

• request inspection flow

• manual partner routing

• remote review

• uploaded photo/video analysis workflow



Pricing Guidance MVP

• simple fair / high / low logic where available

• path-based all-in pricing explanations

• negotiation guidance where reliable



Important rule:



Do not overbuild the first version, but do preserve the product meaning.



⸻



80. Final Guidance Layer Principle



The platform should not just show cars.



It should help the user answer:

• What should I do next?

• What should I verify?

• Is this safe enough for me?

• Is this actually a good deal?

• What is the smartest move for my situation?



This is part of what makes the product a decision platform / reality engine rather than a normal listing experience.



⸻



81. Final Strategic Interpretation



The market is already showing demand for:

• smarter used car buying

• scam avoidance

• all-in cost awareness

• trust and verification

• content that helps users buy better



But that demand is still fragmented across:

• YouTube

• books

• flipper content

• forums

• marketplace behavior

• disconnected advice



The platform opportunity is not just to host content.



The platform opportunity is to unify:

• comparison

• decision support

• verification

• execution



in one place.



That is the opportunity this system should capture.

⸻



---



## 82. Buying Power Layer



The platform should include a Buying Power layer inside the decision experience.



This should not be a generic finance widget.

It should be a reality tool that helps the user clearly understand:



- how much real cash they have

- what the target vehicle/path actually costs

- how much of the transaction depends on outside money

- how much of the deal is truly theirs vs borrowed / structured / financed



The purpose is to remove the common illusion of:



> “I can afford it”



when the real situation is:



> “I can only reach it by depending on someone else’s money.”



---



## 83. Buying Power Core Questions



The Buying Power layer should answer these questions clearly:



1. How much money do I actually have right now?

2. What does this path actually cost all-in?

3. How much of this is my money?

4. How much depends on financing / structured payments / outside money?

5. What is my real buying power today?



This should be shown in simple, blunt, human language.



---



## 84. Buying Power Placement



Buying Power should appear inside See Where You Stand.



Preferred placement:

- after “What You Can Do Today”

- before or near “The Gap”



It should feel like part of the same reality / gap logic, not a separate product.



This layer should update dynamically as:

- path changes

- term changes

- cash changes

- credit changes

- customization changes

- clean / rebuilt changes



---



## 85. Buying Power Structure



The Buying Power layer should show at least these 4 elements:



### 1. Your Cash

Label:

Your Cash



Meaning:

- available cash right now

- the user’s real money currently on hand



Example:

- “You have: $10,000”



---



### 2. Total Cost / All-in Price

Label:

Total Cost

or

All-in Price



Meaning:

- full path-specific cost

- not raw sticker alone



Example:

- “This path costs: $34,500 total”



---



### 3. Your Buying Power

Label:

Your Buying Power



Meaning:

- how far the user’s current cash can realistically take them

- what level of deal they can actually support now



Examples:

- “With your cash, you can realistically move on deals at this level”

- “Your real buying power today is $X toward this path”



This should stay tied to path reality, not generic theoretical finance.



---



### 4. Outside Money Needed

Label:

Outside Money Needed



Meaning:

- the part of the transaction the user cannot cover directly

- the amount that depends on financing, structured payments, credit approval, or other non-cash support



Examples:

- “You need $24,500 from outside sources to reach this deal”

- “Most of this path depends on financing / structured payments”



This is a key clarity layer and should be visually understandable.



---



## 86. Buying Power by Path



Buying Power must adjust based on the active path.



### Dealer

Buying Power should clarify:

- user cash

- estimated down payment

- total all-in cost

- amount dependent on dealer financing / approval



Example interpretation:

- “You have enough for the down payment, but the rest depends on approval and financing.”



Dealer should make it obvious that:

- the user is not buying the whole car with cash

- they are relying on the dealer/bank structure for the remaining amount



---



### Auction / DIY

Buying Power should clarify:

- user cash

- current bid / estimated total

- repairs / transport risk

- whether the user likely has enough cash for the true all-in outcome



Example interpretation:

- “This looks cheaper upfront, but extra cash may be needed for repairs and transport.”



Auction should make it obvious that:

- “cheap” does not always mean affordable

- user may need more cash than the listing suggests



---



### pick n build

Buying Power should clarify:

- user cash

- required 35% down payment (if financed term)

- total all-in cost

- remaining structured amount

- how much is covered by user cash vs structured payments



Examples:

- “You can cover the down payment, but the rest is structured over time.”

- “You cannot cover the required down payment yet.”

- “With cash selected, this is the full amount you would need.”



pick n build should make it obvious:

- no credit is required

- but outside structured money still plays a role unless Cash is selected



---



### Private Seller

Buying Power should clarify:

- user cash

- seller asking price

- whether user can actually cover it now

- no structured support / no financing built into this path



Example interpretation:

- “This path requires full cash. You either have it or you do not.”



Private should be the clearest version of:

- your money vs not enough money



---



## 87. Buying Power Visualization



The platform should support a simple visual representation of buying power.



Example concept:



- Your Money

- Total Cost

- Gap / Outside Money



This can be shown as:

- simple horizontal bar

- stacked bar

- segmented progress bar

- labeled visual scale



The purpose is to make the invisible visible.



The user should instantly see:

- what portion is theirs

- what portion depends on outside money



If a visual introduces too much complexity in MVP, start with clear labeled values first.



---



## 88. Buying Power Language Rules



This layer must use extremely clear, simple wording.



Avoid:

- technical finance jargon

- institutional language

- abstract credit terminology where unnecessary



Preferred ideas:

- “Your Cash”

- “Total Cost”

- “Outside Money Needed”

- “You can cover this”

- “You need more upfront”

- “This depends on approval”

- “This requires full cash”



The goal is not to sound smart.

The goal is to make reality obvious.



---



## 89. Buying Power and the Gap



Buying Power does not replace the gap.

It strengthens it.



The user should now be able to understand:



- the gap in total cost

- the gap in down payment / barrier to entry

- the amount of outside money required

- whether that outside money comes from:

  - dealer financing

  - structured pick n build payments

  - their own future savings

  - or is simply unavailable in a cash-only path



This helps separate:

- what the user wants

- what they truly have

- what the market / path structure is filling in



---



## 90. Buying Power Principle



The purpose of this feature is to help users stop thinking:



> “I can afford it”



when what they really mean is:



> “I can only reach it if someone else’s money fills the gap.”



This is not meant to shame the user.



It is meant to create:

- clarity

- self-awareness

- trust

- better decision-making



This is part of what makes the platform a reality engine rather than just a comparison site.



## 91. Katzkin Seat Customization Integration (If Permitted)



The platform should support a seat customization integration layer for available Katzkin-style seat design options, www.Katzkin.com



Reference source:

- Katzkin’s “Design Your Seats” flow is built around:

  - selecting year

  - make

  - model

  - trim

  - then choosing design

- Katzkin also presents seat-related product option categories such as:

  - Product Options

  - Heating & Cooling

  - Tek Stitch

  - Seat Covers by Color

  - Seat Covers by Make (Katzkin)



### Goal



If possible, bring available seat customization choices into the platform so users can:

- preview seat upgrade paths inside PicknBuild

- include seat preferences in their build

- avoid leaving the platform just to explore seat options

- store seat choices as structured build preferences



This should feel like:

> choose your seat style here, then add it to your build



---



### Core Principle



Do not hardcode random seat options manually if a structured source can be used.



The system should attempt to ingest seat customization options in a structured way.



If direct scraping is not reliable, blocked, or not permitted:

- preserve the concept

- use a fallback structure

- allow manual seat-style selection until a proper integration is available



---



### Desired User Flow



Inside PicknBuild / Add to Your Build / Seats:



1. User selects vehicle

   - year

   - make

   - model

   - trim



2. System checks whether seat design options are available



3. If available, show seat customization categories such as:

   - seat design

   - color

   - stitching / Tek Stitch style

   - heating / cooling option if relevant

   - other seat option groupings if available from source



4. User selects preferred seat configuration



5. Selected seat configuration is stored in the build request



6. If pricing is known, include it in build pricing

   - if not known, store it as a request item / quote-required item



---



### Data Handling



If this integration is possible, store structured seat data such as:

- source name

- vehicle compatibility

- seat design name

- color

- stitch style

- heating/cooling option

- image if available

- SKU / product identifier if available

- quote status / price if available



This should not just be a screenshot dump.

It should be structured enough to:

- display in UI

- attach to build

- support quoting later



---



### MVP Version



If full ingestion is not possible yet, create an MVP version with:



- Seat Upgrade section

- supported manual seat options

- upload image / paste reference link

- “Match this seat style” request

- quote-required state



This allows the seat customization concept to exist now without blocking the rest of the system.



---



### Important Constraints



- Do not break the existing PicknBuild customization flow

- Do not redesign the current seat customization section from scratch

- Add this as an extension of the current Seats customization logic

- If source access is unstable, fail gracefully

- If compatibility is unknown, mark as:

  - Compatibility to be confirmed

  - Quote required



---



### UI Behavior



Inside the Seats area, allow:

- browse available seat options if source data exists

- select a seat configuration

- save it into the build

- attach it to quote / estimate flow



If direct options are unavailable:

- show manual request path instead

- let user upload reference images or links



---



### Strategic Value



This matters because seat customization is a major emotional and visual part of vehicle personalization.



If the user can configure or request seats inside the platform:

- PicknBuild becomes more complete

- users stay on-platform longer

- seat upgrades become part of the structured build

- high-intent customization data is captured



This should strengthen the platform as a full decision + build environment, not just a comparison tool.



92. “Build Your Deal” — Interactive Self-Calculation Layer



Add a structured, interactive calculation flow that allows users to input what they believe and see the real numbers update in real time.



This is NOT a replacement for existing flows.

This is an additive layer that sits after guidance (e.g., after “See Where You Stand”).



⸻



Core Purpose



Allow users to:

• input their own assumptions

• see real total cost (ALL-IN)

• understand trade-offs instantly

• arrive at conclusions themselves



This is a guided self-calculation system, not a basic calculator.



⸻



Entry Point



Place as a secondary action after:

• “See Where You Stand”



Label options:

• “Build Your Deal”

• “Customize Your Numbers”

• “See the Real Cost”



⸻



Step 1 — Market Anchor (User Belief Input)



Prompt:



“What have you been seeing this car go for?”



Inputs:

• Lowest price seen

• Highest price seen



System:

• auto-calculate average



Display:

• “Estimated Market Average: $X”



This step anchors the experience in the user’s reality, not platform-imposed pricing.



⸻



Step 2 — Base Cost Adjustments



Add:

• Tax

• Title

• Doc fees



Optional toggle:

• Shipping (+$1,500 or configurable)



Display:

• “Estimated Total Cost (Before Condition): $X”



⸻



Step 3 — Condition Selection



Options:

• Clean

• Rebuilt



Logic:

• Clean → slight reduction (e.g. ~2%)

• Rebuilt → larger reduction (e.g. ~15%)



Display update:

• “Adjusted Price Based on Condition: $X”



Important:

• This is still ALL-IN cost context



⸻



Step 4 — Cash vs Structured



Prompt:



“How do you want to pay?”



Options:

• Pay in Full (Cash)

• Structure Payments



⸻



Step 5 — If Cash Selected



Display:

• “Total Cost (All-In): $X”



No:

• term

• risk

• down payment

• monthly/biweekly



⸻



Step 6 — If Structured Selected



6A — Term Selection



Show only valid options:

• 1 year

• 2 years

• 3 years

• 4 years

• 5 years



(No ranges — discrete options only)



⸻



6B — Credit Score Input



User inputs credit score OR selects:

• No Credit



System maps to:

• annual risk %



Important:

• Explain simply:

“Based on your credit, your structure adds X% per year”



⸻



Step 7 — Risk + Total Calculation



Formula:



Total Cost = Base Price × (1 + (Annual Risk × Years))



Display clearly:

• Annual risk %

• Total added %

• Final Total Cost (ALL-IN)



⸻



Step 8 — Down Payment + Payment Output



Show:

• Down Payment (35% of TOTAL cost)

• Remaining balance

• Payment:



Dealer-style (if applicable): Monthly

Pick n build-style: Biweekly



Hide payments if:

• Cash selected



⸻



Step 9 — Live Updating Behavior



All inputs must update:

• instantly

• without page reload



Changes affecting output:

• price range

• condition

• shipping

• term

• credit score



⸻



Step 10 — Reinforcement Line



Always show a simple summary:



“You started at ~$X

Your total comes to ~$Y based on your selections”



This highlights the gap between perception and reality.



⸻



Step 11 — Optional Comparison Hook



Allow quick toggle:

• “Compare with Dealer”

• “Compare with Auction”

• “Compare with pick n build”



This connects back to the four-path system without leaving the flow.



⸻



Step 12 — Key Rules

• Always show TOTAL COST (not vehicle price alone)

• No vague ranges

• No hidden numbers

• No jargon-heavy explanations

• Keep language human and direct



⸻



Strategic Role



This feature:

• converts belief → understanding

• removes argument

• increases trust

• increases conversion readiness



It is the execution layer of the decision system.



---



PICKNBUILD PLATFORM — FINAL COMPLETE BUILD SPEC (STAR PACKAGE SYSTEM)



(All references must be written exactly as: picknbuild)



---



==================================================

GLOBAL SYSTEM RULES (APPLIES TO EVERYTHING)

==================================================



1. Platform has TWO DISTINCT FLOWS:

   - picknbuild (structured vehicle sourcing + optional financing)

   - auction (bidding service only)



2. These flows MUST remain visually and logically separate:

   - Separate pages

   - Separate checkout logic

   - Separate disclaimers



3. No hidden pricing:

   - All costs visible before checkout

   - All changes update in real-time



4. User is NOT purchasing a specific VIN (picknbuild only):

   - They are selecting:

     → Make / Model / Year / Mileage range



5. UI MUST feel:

   - Interactive

   - Transparent

   - User-controlled

   - Immediate feedback on changes



---



==================================================

SHARED COMPONENT — TITLE TYPE EXPLAINER

==================================================



UI: clickable link or tooltip  

“What is Clean vs Rebuilt?”



---



CLEAN TITLE:



- No major recorded damage

- May have minor incidents

- Higher resale value

- Lower risk



---



REBUILT TITLE:



- Previously damaged (accident/salvage)

- Repaired and inspected

- May still contain hidden issues

- Lower resale value

- Higher risk, but significantly cheaper



---



USER DECISION GUIDE:



- Want lowest price → rebuilt  

- Want better long-term value → clean  



---



==================================================

FLOW 1 — picknbuild (PRIMARY EXPERIENCE)

==================================================



PAGE: BUILD YOUR DEAL (SINGLE SCREEN CONFIGURATOR)



---



SECTION 1 — BASE VEHICLE



Display:



- Vehicle image

- Estimated market value

- picknbuild price (below market)



---



TOGGLE:



[ Clean Title (-2%) ]  

[ Rebuilt Title (-15%) ]



---



PRICING INCLUDES (BUILT INTO BASE PRICE):



- Doc Fee: $1,000

- Title + Registration: $150



(These are NOT itemized separately)



---



LABEL:



“Base Price (Cash — Below Market Value)”



---



---



SECTION 2 — CUSTOMIZATION (OPTIONAL ADD-ONS)



Each option:



[ + Add ]



Examples:

- Paint

- Interior

- Lighting

- Performance



---



RULES:



- Adds instantly to total

- Updates live pricing panel

- NOT financeable

- Must be paid upfront



---



COPY:



“Customization must be paid upfront and cannot be included in monthly payments.”



---



---



SECTION 3 — PAYMENT METHOD



[ Pay in Full ]  

[ Pay Over Time ]



---



IF “PAY IN FULL”:



→ Skip packages  

→ Proceed to tax + shipping + checkout



---



IF “PAY OVER TIME”:



→ Reveal PACKAGE SECTION



---



---



SECTION 4 — PACKAGE SELECTION (CORE PRODUCT)



(UI must display as selectable cards with star ratings)



---



⭐ Standard Package (1 Year)  



- Short-term option  

- Highest monthly payment  

- Lowest total cost  



---



⭐⭐ Premium Package (2 Years)  



- Balanced option  

- Moderate monthly payment  



---



⭐⭐⭐ Silver Package (3 Years)  



- Most popular  

- Balanced monthly + total  



---



⭐⭐⭐⭐ Platinum Package (4 Years)  



- Lower monthly payments  

- Longer structure  



---



⭐⭐⭐⭐⭐ Gold Package (5 Years)ioiohuir(HIGHLIGHTED)



- Lowest monthly payment  

- Maximum flexibility  

- Longest term  



---



PACKAGE RULES:



- Only ONE selectable

- Required for financing

- Updates instantly:

  - Total price

  - Down payment (35%)

  - Monthly payment



---



---



SECTION 5 — WHAT YOUR PACKAGE INCLUDES



✔ Instant Approval — No Bank Needed  

(Credit does NOT determine approval)



✔ Credit May Be Used for Pricing  

(Used only to structure package, not approval)



✔ Pay Monthly Over Time  

(Based on selected package)



✔ Depreciation & Risk Coverage  

(Covers value loss, wear, and usage)



✔ No Credit Impact  

(Not reported)



✔ Walk-Away Option  

(Return vehicle if unable to continue)



✔ Insurance Required  

(MUST maintain insurance at all times)



---



INSURANCE RULE:



If insurance is canceled:



→ User must voluntarily return vehicle  

OR  

→ Vehicle may be repossessed



---



---



SECTION 6 — LIVE PRICE PANEL (ALWAYS VISIBLE)



Updates in REAL TIME



---



SHOW:



- Base Price  

- + Customization  

- + Package  

- + Tax (8.5%)



Optional:



+ Shipping ($1,500)



---



DISPLAY:



TOTAL: $XX,XXX  

DOWN (35%): $X,XXX  

MONTHLY: $X/mo  



---



---



SECTION 7 — CTA



[ Secure This Vehicle — $1,000 Deposit ]



---



---



SECTION 8 — POST-DEPOSIT FLOW



User receives:



- Receipt

- Wire instructions



---



RULES:



- $1,000 goes toward total

- Unlocks process



---



CRITICAL RULE:



picknbuild DOES NOT:



- purchase vehicle

- begin sourcing

- begin build



UNTIL:



→ 35% down payment is received



---



---



SECTION 9 — VEHICLE AGREEMENT



User agrees to:



- Make / Model / Year / Mileage range



NOT a specific VIN



---



---



SECTION 10 — DELIVERY



If shipping selected:



Estimated delivery:



→ 30–90 days



---



---



SECTION 11 — NON-REFUNDABLE CONDITIONS



Once:



- vehicle is sourced

- OR purchased

- OR build started



→ ALL FUNDS NON-REFUNDABLE



---



==================================================

FLOW 2 — AUCTION (BIDDING SERVICE ONLY)

==================================================



PAGE: AUCTION SERVICE



---



CORE MESSAGE:



“We bid for you. You own the outcome.”



---



---



SECTION 1 — SERVICE COST



Total: $2,500



- $1,000 upfront (bidding fee)

- $1,500 after winning



---



IMPORTANT:



$1,000 is NON-REFUNDABLE once bidding begins



---



---



SECTION 2 — USER INPUT



User provides:



- Vehicle details

- Maximum bid amount



---



CRITICAL RULE:



picknbuild DOES NOT BID until:



→ FULL bid amount is received



---



---



SECTION 3 — FUNDING



User sends:



- Full bid funds (wire transfer)



---



NOTE:



- We may suggest a range

- USER decides final amount



---



---



SECTION 4 — BIDDING PROCESS



- picknbuild bids on behalf of user

- Funds are locked during auction



---



RULES:



- Cannot withdraw funds during bidding

- Funds locked until auction ends



---



---



SECTION 5 — OUTCOME



---



IF USER WINS:



User MUST pay:



- Winning bid amount

- Auction fees

- Shipping cost

- Remaining $1,500 service fee



---



IMPORTANT:



Auction vehicles are:



❗ SOLD AS-IS  

❗ NOT repaired by picknbuild  

❗ USER responsible for all repairs  



---



OPTIONAL:



User may hire picknbuild for repairs



→ Separate quote provided



---



---



IF USER DOES NOT WIN:



User options:



[ Keep funds → bid again ]  

[ Request refund ]



---



REFUND RULES:



- No fees deducted from unused funds

- Funds returned via wire



---



---



SECTION 6 — DELIVERY



Estimated:



→ ~14 days after purchase



---



---



SECTION 7 — LIABILITY DISCLAIMER



User is responsible for:



- Vehicle condition

- Repairs

- Inspection risk

- Title status



---



picknbuild is ONLY responsible for:



→ bidding execution



---



==================================================

FINAL CORE MESSAGE (UI COPY)

==================================================



“Cars lose value over time.



picknbuild structures the deal upfront so we don’t get back less than what we gave.



Auction = raw access  

picknbuild = structured protection”



---



Digital Agreement + Account Activation (Post Vehicle Selection)

• After user selects:

• Vehicle (make, model, year, mileage range)

• Package (Standard, Premium, Silver, Platinum, Gold)

• Pricing (down payment + monthly)

• System prompts user to:

• “Secure Your Vehicle” → Proceed to Agreement



⸻



Vehicle Definition (Non-VIN Based Purchase)

• Customer acknowledges:

• Vehicle is NOT tied to a specific VIN

• Vehicle is defined by:

• Make

• Model

• Year

• Mileage range (e.g. 30k–50k miles)

• Customer agrees:

• Color, trim, and minor features may vary

• Final delivered vehicle will match defined category, not exact listing



⸻



Substitution Policy

• If selected vehicle becomes unavailable:

• Platform may source an equivalent vehicle within defined parameters

• Customer agrees:

• Equivalent vehicle fulfills agreement obligation



⸻



Pricing + Payment Terms

• System displays:

• Down payment

• Monthly payment

• Rules:

• Minimum monthly payment enforced: $500

• User cannot proceed below minimum threshold



⸻



Auction / Pricing Adjustment Clause

• If vehicle price changes due to:

• Auction increase

• Delay in user payment submission

• Then:

• Customer is responsible for price difference

• If vehicle is lost, system will source replacement vehicle



⸻



No Refund Policy

• Once agreement is signed and process begins:

• All payments are non-refundable



⸻



Financing Structure

• Default structure:

• Lease-to-own

• Optional:

• Cash purchase (if selected by user)



⸻



Legal Acknowledgment

• Customer agrees:

• Not purchasing a specific VIN vehicle

• Not entitled to refunds based on:

• Vehicle variation

• Auction price changes

• Replacement sourcing

• Customer agrees not to pursue claims based on above conditions



⸻



Digital Signature + Document Handling

• User signs agreement directly within platform

• System automatically:

• Stores signed agreement in database

• Sends copy to:

• Customer

• Admin



⸻



Account Creation (Automatic After Signing)

• User account is created immediately after agreement completion



⸻



Customer Dashboard (Frontend)



User can:

• View:

• Selected vehicle details (category-based)

• Package selection

• Monthly payment

• Remaining balance

• Track status:

• Vehicle sourcing

• Purchased

• In transit

• Delivered

• Make payments:

• Monthly payments through platform

• View payment history



⸻



Payment System

• Features:

• Manual or automated monthly payments

• Remaining balance tracker

• Payment history log

• Rules:

• Minimum $500/month enforced

• No partial payments below threshold



⸻



Upgrade Policy

• User may request upgrade:

• Only after 12 months of payments

• Restrictions:

• Cannot upgrade before 12 months

• Upgrade window expires after eligibility period



⸻



Downgrade Policy

• User may request downgrade:

• If unable to maintain payment obligations



⸻



Voluntary Surrender Option

• User may choose to:

• Return vehicle

• Exit agreement (terms apply)



⸻



Admin Panel (Backend)



Admin can:

• View:

• All user accounts

• Agreement status (signed/not signed)

• Payment status

• Vehicle status

• Manage:

• Active deals

• Delinquent accounts

• Vehicle replacements

• Upgrade/downgrade requests



⸻



System Flow Integration

• User selects vehicle + package

• System calculates pricing (minimum enforced)

• User signs agreement

• Account is created

• Dashboard becomes active

• Payments begin

• Admin + user track lifecycle