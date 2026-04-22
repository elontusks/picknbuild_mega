# "Build Your Deal" — Interactive Self-Calculation Layer

Add a structured, interactive calculation flow that allows users to input what they believe and see the real numbers update in real time.

This is **NOT** a replacement for existing flows. It is an additive layer that sits after guidance (e.g., after "See Where You Stand").

## Core Purpose

Allow users to:
- input their own assumptions
- see real total cost (ALL-IN)
- understand trade-offs instantly
- arrive at conclusions themselves

This is a **guided self-calculation system**, not a basic calculator.

## Entry Point

Place as a secondary action after "See Where You Stand".

Label options:
- "Build Your Deal"
- "Customize Your Numbers"
- "See the Real Cost"

## Step 1 — Market Anchor (User Belief Input)

Prompt:

> "What have you been seeing this car go for?"

Inputs:
- Lowest price seen
- Highest price seen

System auto-calculates average.

Display:

> "Estimated Market Average: $X"

This step anchors the experience in the user's reality, not platform-imposed pricing.

## Step 2 — Base Cost Adjustments

Add:
- Tax
- Title
- Doc fees

Optional toggle:
- Shipping (+$1,500 or configurable)

Display:

> "Estimated Total Cost (Before Condition): $X"

## Step 3 — Condition Selection

Options:
- Clean
- Rebuilt

Logic:
- Clean → slight reduction (e.g. ~2%)
- Rebuilt → larger reduction (e.g. ~15%)

Display update:

> "Adjusted Price Based on Condition: $X"

Important: This is still ALL-IN cost context.

## Step 4 — Cash vs Structured

Prompt:

> "How do you want to pay?"

Options:
- Pay in Full (Cash)
- Structure Payments

## Step 5 — If Cash Selected

Display:

> "Total Cost (All-In): $X"

No term, risk, down payment, monthly/biweekly shown.

## Step 6 — If Structured Selected

### 6A — Term Selection

Show only valid options:
- 1 year
- 2 years
- 3 years
- 4 years
- 5 years

(No ranges — discrete options only.)

### 6B — Credit Score Input

User inputs credit score OR selects **No Credit**.

System maps to annual risk %.

Explain simply:

> "Based on your credit, your structure adds X% per year"

## Step 7 — Risk + Total Calculation

Formula:

```
Total Cost = Base Price × (1 + (Annual Risk × Years))
```

Display clearly:
- Annual risk %
- Total added %
- Final Total Cost (ALL-IN)

## Step 8 — Down Payment + Payment Output

Show:
- Down Payment (35% of TOTAL cost)
- Remaining balance
- Payment:
  - Dealer-style (if applicable): Monthly
  - picknbuild-style: Biweekly

Hide payments if Cash selected.

## Step 9 — Live Updating Behavior

All inputs must update instantly, without page reload.

Changes affecting output:
- price range
- condition
- shipping
- term
- credit score

## Step 10 — Reinforcement Line

Always show a simple summary:

> "You started at ~$X. Your total comes to ~$Y based on your selections"

Highlights the gap between perception and reality.

## Step 11 — Optional Comparison Hook

Allow quick toggle:
- "Compare with Dealer"
- "Compare with Auction"
- "Compare with picknbuild"

Connects back to the four-path system without leaving the flow.

## Step 12 — Key Rules

- Always show TOTAL COST (not vehicle price alone)
- No vague ranges
- No hidden numbers
- No jargon-heavy explanations
- Keep language human and direct

## Strategic Role

This feature:
- converts belief → understanding
- removes argument
- increases trust
- increases conversion readiness

It is the execution layer of the decision system.

---

Source: §92 "Build Your Deal" Interactive Self-Calculation Layer
