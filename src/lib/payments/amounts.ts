// Prices (in USD dollars) for the payment flows Team 14 owns. Stripe amounts
// are integer cents, so helpers live here too to keep conversions in one
// place.

export const DEPOSIT_AMOUNT_USD = 1000;
export const LEAD_UNLOCK_AMOUNT_USD = 15;
export const LISTING_FEE_AMOUNT_USD = 5;
export const DEALER_SUBSCRIPTION_AMOUNT_USD = 99;

export const toStripeAmountCents = (amountUsd: number): number =>
  Math.round(amountUsd * 100);

export const fromStripeAmountCents = (amountCents: number): number =>
  Math.round(amountCents) / 100;
