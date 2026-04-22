# 14. Messaging System

The platform must include messaging. Messaging exists to support decision-making, transaction inference, and trust between participants.

## 14.1 Supported Messaging

The messaging system must support the following conversation pairs:

- Buyer ↔ individual seller
- Buyer ↔ PicknBuild team
- Buyer ↔ dealer (optional, depending on monetization rules)

| Pair | Required? | Notes |
| --- | --- | --- |
| Buyer ↔ individual seller | Required | Must remain on-platform |
| Buyer ↔ PicknBuild team | Required | Support, guidance, "Talk to Someone" flow |
| Buyer ↔ dealer | Optional | Availability depends on monetization rules |

## 14.2 Rules

- Individual seller messaging must remain on-platform.
- No uncontrolled direct contact sharing is allowed.
- Message history must be stored.
- Messaging must feed into transaction inference.

### Implications

- Private contact details (phone numbers, external chat handles, emails) cannot be exchanged in a way that bypasses platform controls.
- Stored message history enables auditing, dispute resolution, and signals for the transaction inference layer.
- Messaging is not a standalone feature; it is an input signal that helps infer buying intent, deal progression, and conversion likelihood.

---

Source: §14

