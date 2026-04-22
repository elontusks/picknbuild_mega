import type {
  IntakeState,
  ListingObject,
  PathKind,
  PathQuote,
  TitleStatus,
} from "@/contracts";
import {
  resolveCreditBand,
  resolveDownPaymentPercentage,
  type CreditTierInput,
} from "@/lib/pricing/credit-tier";
import {
  isFinancedTerm,
  termToBiweeklyCount,
  termToMonths,
  type FinancedTerm,
} from "@/lib/pricing/term-cadence";
import {
  computePicknbuildPrice,
  type PicknbuildPriceInputs,
  type PicknbuildPriceOutputs,
} from "@/lib/pricing/picknbuild-quote";
import {
  computeDealerApr,
  type DealerAprInputs,
  type DealerAprOutputs,
} from "@/lib/pricing/dealer-quote";
import {
  quoteAllPathsForListing,
  quotePathForListing,
} from "@/lib/pricing/all-paths";
import { estimateTradeIn } from "@/lib/pricing/trade-in";
import {
  estimateAlreadyHaveACar as estimateAlreadyHaveACarCore,
  type AlreadyHaveACarInputs,
  type AlreadyHaveACarResult,
} from "@/lib/pricing/already-have-a-car";

export type {
  CreditTierInput,
  FinancedTerm,
  PicknbuildPriceInputs,
  PicknbuildPriceOutputs,
  DealerAprInputs,
  DealerAprOutputs,
};

export { resolveCreditBand };

export const resolveDownPayment = (input: CreditTierInput) =>
  resolveDownPaymentPercentage(input);

// Back-compat alias for prior callers
export { resolveDownPaymentPercentage };

export { termToBiweeklyCount, termToMonths, isFinancedTerm };

export { computePicknbuildPrice };
export { computeDealerApr };

export const quotePath = async (
  path: PathKind,
  listing: ListingObject,
  intake: IntakeState,
): Promise<PathQuote> => quotePathForListing(path, listing, intake);

export const quoteAllPaths = async (
  listing: ListingObject,
  intake: IntakeState,
): Promise<PathQuote[]> => quoteAllPathsForListing(listing, intake);

export const estimateTradeInValue = async (input: {
  vin: string;
  titleStatus: Extract<TitleStatus, "clean" | "rebuilt">;
  year?: number;
  mileage?: number;
}): Promise<{ estimatedTradeInValue: number }> => {
  const { estimatedTradeInValue } = estimateTradeIn(input);
  return { estimatedTradeInValue };
};

export type AlreadyHaveACarEstimate =
  | { ok: true; estimate: number; assumptions: string[] }
  | { ok: false; reason: "quote-required" };

export const estimateAlreadyHaveACar = async (
  input: AlreadyHaveACarInputs,
): Promise<AlreadyHaveACarEstimate> => {
  const result: AlreadyHaveACarResult = estimateAlreadyHaveACarCore(input);
  if (result.ok) {
    return { ok: true, estimate: result.estimate, assumptions: result.assumptions };
  }
  return { ok: false, reason: result.reason };
};
