# Data Ingestion + Scraping Engine

Status: Mandatory.

## Purpose

The platform must automatically collect and maintain vehicle inventory across all sources without relying on manual input.

## Required Sources

The system must ingest data from:

- Dealer websites and inventory feeds
- Auction platforms (IAAI, Copart, etc.)
- External marketplaces (Facebook Marketplace, Craigslist via link ingestion)

## Behavior

The system must:

- Automatically pull new listings
- Update existing listings
- Remove or mark unavailable listings
- Normalize all data into a consistent format

## Update Frequency

| Source                   | Required Frequency                      |
| ------------------------ | --------------------------------------- |
| Dealer inventory         | At least every 24 hours                 |
| Auction data             | Near real-time or frequent intervals    |
| User-submitted listings  | Immediate                               |

## Data Handling

The system must:

- Store listings in a database
- Detect duplicates
- Merge duplicate listings when possible
- Maintain listing history

## Failure Handling

If scraping fails, the system must:

- Retry
- Log failures
- Not break user experience

## Overarching Rule

The platform must function as a continuously updating system, not a static dataset.

---

Source: §4.10 (Data Ingestion + Scraping Engine)
