# 07 - User Account and Profile System

## Purpose

Profiles are the identity layer of the platform. Every action must tie back to a persistent profile. Profiles are what give posts, listings, messages, leads, and feed activity their provenance and accountability.

## Universal Rule

**Every action in the platform must belong to a user profile or claimed page.** There is no anonymous action surface: posting, listing, commenting, messaging, lead creation, and any other user-generated event must be attributed to a profile or a claimed dealer page.

## Buyer Profile

A Buyer Profile must include the following fields:

- Display name / username
- Optional profile photo
- Location
- Saved searches
- Financial preference summary
- Garage
- Posts and comments
- Invite count
- Leaderboard position
- Badges earned
- Activity history

## Dealer Profile / Dealer Page

A Dealer Profile / Dealer Page must include the following fields:

- Dealership name
- Verified / claimed status
- Location
- Active listings
- Feed posts
- Lead activity
- Subscription status
- Profile credibility signals

### Dealer Claim Page Capabilities (Expanded Control After Claim)

After claiming their page, dealers must have expanded control over the page. Specifically, dealers must be able to:

- Update dealership profile information
- Upload logo and media
- Post to the feed
- Manage response settings
- View basic performance analytics

These capabilities unlock once the page has been successfully claimed and verified; unclaimed pages do not expose this expanded control surface.

## Individual Seller Profile

An Individual Seller Profile must include the following fields:

- Display name
- Location
- Active listing
- Message inbox
- Feed activity
- Trust indicators

## Summary Table

| Profile Type | Listings | Feed | Leads | Trust/Credibility | Monetization |
| --- | --- | --- | --- | --- | --- |
| Buyer | Saved searches, Garage | Posts and comments | n/a | Badges, leaderboard | n/a |
| Dealer (claimed) | Active listings | Feed posts, response settings | Lead activity | Verified/claimed status, credibility signals | Subscription status |
| Individual seller | Active listing | Feed activity | Message inbox | Trust indicators | n/a |

---

Source: §6, §29.11.6
