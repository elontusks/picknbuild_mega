# Deposit, Payment Tracking & Post-Deposit

## Deposit Structure

The platform should require a **$1,000 deposit** before execution begins.

### Behavior
- deposit is required to proceed
- deposit is tracked in system
- deposit is applied toward:
  - picknbuild total cost
  - OR auction procurement fee

### Auction note
Auction procurement fee:
- total = $2,500
- deposit = $1,000 applied toward it
- remaining = $1,500 due later

## Payment Methods and Flow

### Initial Payment
- $1,000 deposit
- processed through integrated payment system (e.g. Stripe or equivalent)

### Remaining Payments

**picknbuild:**
- remaining down payment OR full cash amount
- OR structured payment plan

**Auction:**
- remaining procurement fee
- auction funding (cash required)

### Payment Methods
Support:
- card (for deposit)
- ACH / bank transfer
- wire instructions

If wiring is used:
- provide clear instructions inside platform
- track payment status

## Full Payment Tracking System

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

## Post-Deposit Workflow

### picknbuild
- status: "Build Started"
- sourcing begins
- vehicle matching begins
- timeline shown
- next steps shown

### Auction
- status: "Auction Support Started"
- bidding / sourcing workflow begins
- user notified of next actions

## No-Manual Handling Goal

System should be built so:
- all forms are digital
- all agreements are signed in-platform
- all payments are tracked in-platform
- all steps are visible to the user

Goal:

> No manual chasing, no external tracking, no disconnected communication.

## User Dashboard (Post-Commitment)

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

## Key Principle

The system should ensure:
- clarity before commitment
- commitment before execution
- execution is tracked
- payments are transparent
- no ambiguity about what the user agreed to

## Final Behavior Summary

**Before deposit:**
- user explores
- compares
- understands

**At deposit:**
- user commits to specs
- signs agreement
- enters execution flow

**After deposit:**
- system takes over
- process becomes structured and trackable

## Final Rule

The user should feel:

> "I know exactly what I'm committing to, and I can see everything happening after I pay."

---

Source: §56 Deposit Structure, §57 Payment Methods, §58 Payment Tracking, §59 Post-Deposit Workflow, §60 No-Manual Handling, §61 User Dashboard, §62 Key Principle, §63 Final Behavior Summary, §64 Final Rule
