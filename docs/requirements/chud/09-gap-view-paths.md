# Gap View — Path-Specific Logic

## Dealer + picknbuild Term Selector

Inside Dealer and picknbuild only, add:

> Choose Your Term

Show only valid/available terms, plus Cash if available.

Examples:
- Dealer: Cash, 3, 4, 5, 6 years
- picknbuild: Cash, 1–5 years
- only show what is actually available

**No unavailable terms.**

Always have a selected term:
- default to Cash if available
- otherwise shortest available term

## Dealer Logic in "See Where You Stand"

### If term = Cash
Hide:
- Down Payment (Estimated)
- Monthly payment

Show:
- Total Cost (All-in)

### If financed term selected
Show:
- Down Payment (Estimated)
- Total Cost (All-in)
- Estimated Monthly Payment

### Dealer notes
- approval required
- good credit usually needed
- higher interest over time
- same-day is possible if approved

Gap should reflect:
- approval dependency
- estimated down payment
- total cost
- monthly payment

## picknbuild Logic in "See Where You Stand"

### If term = Cash
Hide:
- Down Payment (35%)
- Biweekly payment

Show:
- Total Cost (All-in)

### If financed term selected
Show:
- Down Payment (35%)
- Total Cost (All-in)
- Estimated Biweekly Payment

### Critical down payment rule
For picknbuild: **down payment = 35% of TOTAL ALL-IN COST for the selected term**.

Not vehicle price alone.

### Minimum payment rule
picknbuild has a minimum payment threshold equivalent to **$500/month**. Only show terms that satisfy the business rule.

Terms may vary case by case. **Do not hardcode all terms universally.**

Gap should reflect:
- down payment gap
- total cost gap
- biweekly payment at selected term

## Auction Logic in "See Where You Stand"

Auction should not behave like Dealer or picknbuild.

Show:
- Current Bid
- Estimated Total Cost
- note that repairs / transport / unknowns may change final total

**No down payment section.**

Barrier to entry:
- cash
- transport
- repairs
- unknown condition

Timeline:
- approximately 1–2 weeks after win, varies

## Private Seller Logic in "See Where You Stand"

Keep this simplest.

Show:
- Price (Cash Required)

Possible note:
- you pay seller directly
- unknown seller / unknown car condition
- no built-in protection

**No financing, no down payment, no term selector.**

Timeline: immediate / same day if deal works out.

## Barrier to Entry / Path Reality Lines

Each path should clearly show what the real barrier is.

### Dealer
Barrier to entry: approval + down payment + credit

### Auction
Barrier to entry: cash + repairs + transport + unknowns

### picknbuild
Barrier to entry: ~35% down + build time

### Private Seller
Barrier to entry: full cash + your own inspection / risk

Add a short line:
> What this path really requires: ...

Keep plain and blunt.

---

Source: §21 Term Selector, §22 Dealer Logic, §23 picknbuild Logic, §24 Auction Logic, §25 Private Seller Logic, §26 Barrier to Entry
