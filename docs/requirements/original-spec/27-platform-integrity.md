# Platform Integrity

This document captures the remaining §29 platform-integrity requirements not covered elsewhere: legal disclaimers, data privacy, logging and monitoring, and external data failure handling.

## §29.4 Legal and Estimation Disclaimers

Because the system provides financial and pricing estimates, the following must be clearly stated:

- All pricing is an estimate, not a guarantee.
- Financing is subject to approval.
- Auction outcomes may vary.
- PicknBuild may not be the direct seller depending on the path.

## §29.5 Data Privacy and User Control

Must include:

- Secure storage of financial inputs.
- User ability to update or delete their data.
- Financial data used only for estimation purposes.

## §29.6 System Logging and Monitoring

Must include logs of:

- User actions
- Scraping activity
- Errors and failures
- Payment activity

### Purpose

- Debugging
- System reliability
- Internal analytics

## §29.7 External Data Failure Handling

If external sources fail, the system must:

- Show last known data.
- Provide estimated alternatives.
- Avoid breaking the user experience.

## Requirements Summary

| Area | Requirement |
| --- | --- |
| Legal disclaimers | Pricing is estimate; financing subject to approval; auction outcomes vary; PicknBuild may not be direct seller |
| Data privacy | Secure storage; user can update/delete; data used only for estimation |
| Logging | User actions, scraping, errors, payments |
| External failure | Show last known; estimated alternatives; never break UX |

---

Source: §29.4, §29.5, §29.6, §29.7
