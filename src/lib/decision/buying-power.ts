import type { IntakeState, PathQuote } from "@/contracts";

export type BuyingPowerLayer = {
  yourCash: number;
  totalCost: number;
  buyingPower: number;
  outsideMoneyNeeded: number;
};

/**
 * Pure client math (§3 / ch/24). Compares the buyer's cash against a path's
 * all-in total and reports how much of the cost their cash covers and how
 * much would have to come from outside (financing / savings gap). Financed
 * paths (dealer / picknbuild) show the cash-view intentionally — Buying Power
 * answers "could you walk away with this today on cash alone," not "can you
 * make the payments."
 */
export const computeBuyingPower = (
  intake: Pick<IntakeState, "cash">,
  quote: Pick<PathQuote, "total">,
): BuyingPowerLayer => {
  const yourCash = Math.max(0, Math.round(intake.cash));
  const totalCost = Math.max(0, Math.round(quote.total));
  const buyingPower = Math.min(yourCash, totalCost);
  const outsideMoneyNeeded = Math.max(0, totalCost - yourCash);
  return { yourCash, totalCost, buyingPower, outsideMoneyNeeded };
};
