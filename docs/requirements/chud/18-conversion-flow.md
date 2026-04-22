# Conversion and Checkout Flow

The platform treats conversion as a **two-step process**:

1. **Decision Conversion** — user clearly understands their situation and selects a path.
2. **Payment Conversion** — user commits to executing that path.

Do not introduce payment before clarity is established.

## Path-Based Conversion Points

Each path has different conversion behavior and should not be forced into a single checkout model.

### Dealer Conversion

Dealer is not a direct checkout path in most cases.

**Primary conversion actions:**
- Contact Dealer
- Get This Deal
- Continue with Dealer

**Behavior:**
- user action creates a lead signal
- dealer is notified through platform
- dealer re-engages through platform workflow

**Platform monetization:** dealer-side (lead, subscription, or unlock model).

**Do not force full payment checkout on Dealer path.**

### Auction / DIY Conversion

Auction is a service-based conversion.

**Primary conversion actions:**
- Start Auction Support
- Get Help With This Auction

**Behavior:**
- user commits to using platform assistance
- service workflow begins

**Platform monetization:** service fee for auction support, sourcing, logistics, or coordination.

**Do not treat auction as a direct product checkout.**

### picknbuild Conversion

picknbuild is the **primary direct checkout path**.

**Primary conversion actions:**
- Start Now
- Secure Your Build
- Place Deposit

**Behavior:**
- user has already seen:
  - total cost
  - down payment
  - term
  - biweekly payment
  - timeline
- user commits to execution

**Checkout step:** collect refundable deposit (example: $1,000 if already used in system).

**After checkout:**
- build process begins
- sourcing / confirmation workflow starts

This is the main buyer-to-platform payment flow.

### Private Seller Conversion

Private Seller is initially an intent-based conversion.

**Primary conversion actions:**
- Message Seller
- Show Interest

**Behavior:**
- user expresses interest
- seller receives signal
- seller is brought into platform flow

**Future monetization (optional):**
- inspection
- payment protection
- title handling
- escrow services

**Do not force immediate checkout on private seller path.**

## Payment Timing Rule

Payment must only appear after:
- path is selected
- costs are visible
- terms are selected (if applicable)
- user understands the gap
- user sees payment structure (monthly or biweekly if applicable)

**No early checkout prompts.**

## Execution CTAs by Path

| Path | CTA |
|------|-----|
| Dealer | Contact / Continue with Dealer |
| Auction | Start Auction Support |
| picknbuild | Start Now / Place Deposit |
| Private | Message Seller |

These should feel like the next logical step, not a forced checkout.

## Post-Conversion State

After a user completes a conversion action, the platform does not end the experience. It transitions into a visible progress state.

### picknbuild post-state
- deposit received
- build started
- next steps visible
- timeline visible
- ability to track progress

### Auction post-state
- support initiated
- next steps visible
- tracking or coordination state

### Dealer post-state
- lead sent
- awaiting dealer response
- user can continue interaction through platform

### Private Seller post-state
- seller notified
- connection in progress
- seller prompted to enter platform flow

## Platform Monetization Model

### Buyer-side revenue
- picknbuild deposit
- auction support fees
- optional protection / inspection services

### Seller-side revenue
- dealer lead access or subscriptions
- promoted listings (future)
- sponsor boards (future)

## Conversion Philosophy

- Do not ask for money before the user understands their situation.
- Do not push checkout before showing all paths.
- Do not interrupt comparison with payment prompts.

The correct order is:

1. Input (cash, credit, preferences)
2. Compare all paths
3. Show best path
4. Show gap and reality
5. Allow user to choose
6. Then allow payment / execution

## Final Conversion Principle

The system should feel like:

- the user decides first
- the platform executes second

The user should never feel pushed into payment. They should feel:

> "I understand my options, and now I'm ready to move forward."

---

Source: §44 Conversion and Checkout Flow, §45 Path-Based Conversion Points, §46 Payment Timing, §47 Execution CTAs, §48 Post-Conversion State, §49 Monetization, §50 Conversion Philosophy, §51 Final Conversion Principle
