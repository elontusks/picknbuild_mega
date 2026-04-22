# Digital Agreement, Account Activation, and Dashboards

## Digital Agreement + Account Activation (Post Vehicle Selection)

After user selects:
- Vehicle (make, model, year, mileage range)
- Package (Standard, Premium, Silver, Platinum, Gold)
- Pricing (down payment + monthly)

System prompts user to:

> "Secure Your Vehicle" → Proceed to Agreement

## Vehicle Definition (Non-VIN Based Purchase)

Customer acknowledges:
- Vehicle is **NOT** tied to a specific VIN
- Vehicle is defined by:
  - Make
  - Model
  - Year
  - Mileage range (e.g. 30k–50k miles)

Customer agrees:
- Color, trim, and minor features may vary
- Final delivered vehicle will match defined category, not exact listing

## Substitution Policy

If selected vehicle becomes unavailable:
- Platform may source an equivalent vehicle within defined parameters

Customer agrees:
- Equivalent vehicle fulfills agreement obligation

## Pricing + Payment Terms

System displays:
- Down payment
- Monthly payment

### Rules
- Minimum monthly payment enforced: **$500**
- User cannot proceed below minimum threshold

## Auction / Pricing Adjustment Clause

If vehicle price changes due to:
- Auction increase
- Delay in user payment submission

Then:
- Customer is responsible for price difference
- If vehicle is lost, system will source replacement vehicle

## No Refund Policy

Once agreement is signed and process begins:
- All payments are **non-refundable**

## Financing Structure

- **Default structure:** lease-to-own
- **Optional:** cash purchase (if selected by user)

## Legal Acknowledgment

Customer agrees:
- Not purchasing a specific VIN vehicle
- Not entitled to refunds based on:
  - Vehicle variation
  - Auction price changes
  - Replacement sourcing
- Customer agrees not to pursue claims based on above conditions

## Digital Signature + Document Handling

- User signs agreement directly within platform
- System automatically:
  - Stores signed agreement in database
  - Sends copy to:
    - Customer
    - Admin

## Account Creation (Automatic After Signing)

User account is created immediately after agreement completion.

## Customer Dashboard (Frontend)

User can:

### View
- Selected vehicle details (category-based)
- Package selection
- Monthly payment
- Remaining balance

### Track status
- Vehicle sourcing
- Purchased
- In transit
- Delivered

### Make payments
- Monthly payments through platform
- View payment history

## Payment System

### Features
- Manual or automated monthly payments
- Remaining balance tracker
- Payment history log

### Rules
- Minimum $500/month enforced
- No partial payments below threshold

## Upgrade Policy

User may request upgrade:
- Only after 12 months of payments

### Restrictions
- Cannot upgrade before 12 months
- Upgrade window expires after eligibility period

## Downgrade Policy

User may request downgrade if unable to maintain payment obligations.

## Voluntary Surrender Option

User may choose to:
- Return vehicle
- Exit agreement (terms apply)

## Admin Panel (Backend)

Admin can:

### View
- All user accounts
- Agreement status (signed/not signed)
- Payment status
- Vehicle status

### Manage
- Active deals
- Delinquent accounts
- Vehicle replacements
- Upgrade/downgrade requests

## System Flow Integration

1. User selects vehicle + package
2. System calculates pricing (minimum enforced)
3. User signs agreement
4. Account is created
5. Dashboard becomes active
6. Payments begin
7. Admin + user track lifecycle

---

Source: Star Package System — Digital Agreement + Customer Dashboard + Admin Panel sections
