# Trust and Verification Layer

This document covers the supply-source trust layer, identity verification, reporting and moderation, and rate limiting / abuse protection.

## §23 Trust and Verification Layer

The system should indicate the trust level of supply sources.

### Trust Indicators

Trust indicators may include:

- Verified dealer
- Claimed page
- Platform-native seller
- External link source
- Suspicious / flagged patterns

| Indicator | Meaning |
| --- | --- |
| Verified dealer | Dealer identity has been verified by PicknBuild |
| Claimed page | Dealer/seller page has been claimed by its owner |
| Platform-native seller | Seller listed directly on PicknBuild |
| External link source | Listing originates from an external source |
| Suspicious / flagged patterns | Pattern-based warning on the source |

### Purpose

Help users understand source credibility and reduce risky decisions.

## §29.1 Identity Verification

Requirements:

- Email verification required for all users.
- Phone verification required for sellers and high-intent actions.
- Duplicate account detection.
- Ability to flag suspicious behavior.

## §29.2 Reporting and Moderation

### User capabilities

Users must be able to:

- Report listings
- Report feed posts
- Report users

### Admin capabilities

Admin must be able to:

- Review reports
- Remove listings
- Remove posts
- Suspend or ban users

## §29.3 Rate Limiting and Abuse Protection

Must include:

- Limits on messages per time window
- Limits on listing creation
- Invite abuse detection
- Automated spam filtering

---

Source: §23, §29.1, §29.2, §29.3
