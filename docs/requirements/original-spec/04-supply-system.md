# Supply Ingestion System

## 7.1 Purpose

PicknBuild must not rely on users or dealers to manually seed inventory. Supply must be pulled into the system continuously.

## 7.2 Dealer Supply Ingestion

The system must continuously ingest dealer inventory.

### Required Normalization Fields

- Vehicle title
- Year, make, model, trim
- VIN when available
- Mileage
- Price
- Down payment if known
- Location
- Images
- Stock number if available

### Behavior

- Auto-create listings
- Auto-assign dealer name
- Show publicly even before dealer claim

## 7.3 Dealer Claim + Auto-Listing System

The platform must support a full scraped-listing-to-claimed-page flow.

### Before Claim

- Dealer inventory is visible
- Listings are controlled by the system
- Buyer interest can still be captured
- PicknBuild can route or monitor those interactions

### Claim Flow

1. Dealer searches for dealership
2. Verifies ownership by email, phone, or manual review
3. Claims page

### After Claim

The dealer can:

- Edit listings
- Manage profile
- Receive and unlock leads
- Subscribe
- Add listings beyond scraped supply

### Rule

Scraped listings must exist without dealer participation. Claiming transfers control of an existing page, not creates a new one.

## 7.4 Auction Supply Ingestion

### Sources

- IAAI
- Copart
- Other relevant auction sources over time

### Required Data

- Current bid
- Vehicle details
- Sale timing
- Auction location
- Auction status
- Images
- Title type if available

### System Behavior

The system must:

- Refresh auction data frequently
- Store historical price behavior
- Support live or near-live status where possible

## 7.5 Individual Supply Ingestion

The system must ingest and display individual supply from:

- Facebook Marketplace links
- Craigslist links
- Other external private listing links over time

### Behavior

- Capture visible listing data
- Create structured internal objects
- Allow redirect to original source if needed
- Support internal messaging if listing is platform-native

## 7.6 User-Generated Supply

Users must be able to:

- Paste a link
- Upload a car
- Manually create a listing
- List a car they own during onboarding or later

## 7.7 Found a Better Deal Loop

- Feature name: **Found a Better Deal?**
- Purpose: If the user does not find what they want, they can paste an external listing. The system uses that as signal, data, and supply.

### Flow

1. User pastes link
2. System parses details
3. System creates internal listing object
4. System categorizes it into dealer, auction, or individual path
5. System runs Reality Check
6. System inserts it into future search results and comparisons

### Rule

Every externally submitted deal must become a usable object in the system.

## 7.8 Duplicate Handling

The system must detect duplicates based on VIN or strong matching attributes.

If the same car appears in multiple paths, the system should:

- Merge into one vehicle object when possible
- Show multiple acquisition paths under that vehicle
- Avoid cluttering results with duplicate standalone cards

## 7.9 Data Refresh Frequency

| Supply Type              | Refresh Cadence                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------ |
| Dealer data              | Refreshed at least daily                                                             |
| Auction data             | Refreshed near real-time where possible, otherwise every few minutes or hourly depending on source constraints |
| User-submitted listings  | Processed immediately                                                                |
| External link submissions| Parsed immediately when submitted                                                    |

---

Source: §7 (Supply Ingestion System), subsections 7.1–7.9
