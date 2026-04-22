import { describe, expect, test } from "vitest";
import {
  DEALER_SUBSCRIPTION_AMOUNT_USD,
  DEPOSIT_AMOUNT_USD,
  LEAD_UNLOCK_AMOUNT_USD,
  LISTING_FEE_AMOUNT_USD,
  fromStripeAmountCents,
  toStripeAmountCents,
} from "@/lib/payments/amounts";

describe("payment amounts", () => {
  test("canonical USD prices match the product spec", () => {
    expect(DEPOSIT_AMOUNT_USD).toBe(1000);
    expect(LEAD_UNLOCK_AMOUNT_USD).toBe(15);
    expect(LISTING_FEE_AMOUNT_USD).toBe(5);
    expect(DEALER_SUBSCRIPTION_AMOUNT_USD).toBe(99);
  });

  test("USD <-> cents round-trips without float drift", () => {
    for (const dollars of [0, 1, 5, 99, 1000, 12.34]) {
      expect(fromStripeAmountCents(toStripeAmountCents(dollars))).toBeCloseTo(
        dollars,
      );
    }
  });

  test("toStripeAmountCents rounds to whole cents", () => {
    expect(toStripeAmountCents(12.34)).toBe(1234);
    expect(toStripeAmountCents(0.1 + 0.2)).toBe(30);
    expect(toStripeAmountCents(1000)).toBe(100000);
  });
});
