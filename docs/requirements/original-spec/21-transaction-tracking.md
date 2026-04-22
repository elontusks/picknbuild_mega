# Transaction Tracking and Outcome Inference

The system must learn from transactions, even when they happen partly or fully off-platform.

## 21.1 Signals

The system observes the following signals:

- Message frequency
- Response speed
- Conversation depth
- Repeated listing views
- Saves
- Listing removal
- Listing marked unavailable
- Price changes

## 21.2 Inference Logic

Example:

> If a buyer and seller exchange repeated messages and the listing is removed soon after, the system may infer a probable sale.

## 21.3 Data Captured

When an outcome is inferred, the following is captured:

- Vehicle
- Estimated transaction price
- Path used
- Location
- Likely outcome

| Field | Description |
| --- | --- |
| Vehicle | The vehicle involved in the inferred transaction |
| Estimated transaction price | Model-derived estimate of sale price |
| Path used | Which of the four paths drove the outcome |
| Location | Geographic location of the transaction |
| Likely outcome | Inferred status (sold, pending, stalled, etc.) |

## Purpose

- Improve Reality Check
- Improve prediction quality
- Improve pricing intelligence
- Improve system learning

---

Source: §21
