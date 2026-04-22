import type { Condition } from "../types";

export const dealerPageClaimed: Condition = (p) =>
  p.dealer?.page_claimed
    ? { passed: true }
    : { passed: false, reason: "Dealer page must be claimed." };

export const dealerSubscriptionActive: Condition = (p) =>
  p.dealer?.subscription_active
    ? { passed: true }
    : { passed: false, reason: "Dealer subscription is inactive." };
