import {
  makeFixturePathQuote,
  type IntakeState,
  type ListingObject,
  type PathKind,
  type PathQuote,
  type Term,
} from "@/contracts";

export type CreditTierInput = { creditScore?: number; noCredit?: boolean };

export const resolveDownPaymentPercentage = ({
  creditScore,
  noCredit,
}: CreditTierInput): number => {
  if (noCredit) return 0.4;
  if (creditScore === undefined) return 0.3;
  if (creditScore >= 720) return 0.15;
  if (creditScore >= 660) return 0.2;
  if (creditScore >= 580) return 0.3;
  return 0.35;
};

export const termToBiweeklyCount = (term: Exclude<Term, "cash">): number => {
  const map: Record<Exclude<Term, "cash">, number> = {
    "1y": 26,
    "2y": 52,
    "3y": 78,
    "4y": 104,
    "5y": 130,
  };
  return map[term];
};

export type PicknbuildPriceInputs = {
  basePrice: number;
  tax?: number;
  fees?: number;
  customizationsTotal?: number;
  titleStatus: "clean" | "rebuilt";
  creditScore?: number;
  noCredit?: boolean;
  tradeInValue?: number;
  term: Exclude<Term, "cash">;
};

export type PicknbuildPriceOutputs = {
  total: number;
  down: number;
  remaining: number;
  biweekly: number;
};

export const computePicknbuildPrice = (
  input: PicknbuildPriceInputs,
): PicknbuildPriceOutputs => {
  const rebuiltDiscount = input.titleStatus === "rebuilt" ? 0.9 : 1;
  const base = input.basePrice * rebuiltDiscount;
  const subtotal = base + (input.tax ?? 0) + (input.fees ?? 0) + (input.customizationsTotal ?? 0);
  const afterTrade = Math.max(0, subtotal - (input.tradeInValue ?? 0));
  const downPct = resolveDownPaymentPercentage(input);
  const down = Math.round(afterTrade * downPct);
  const remaining = afterTrade - down;
  const biweekly = Math.round(remaining / termToBiweeklyCount(input.term));
  return { total: afterTrade, down, remaining, biweekly };
};

export type DealerAprInputs = {
  creditScore?: number;
  noCredit?: boolean;
  listingPrice: number;
  term: Exclude<Term, "cash">;
};

export type DealerAprOutputs = {
  apr: number;
  monthly: number;
  totalPaid: number;
  interestPaid: number;
  approvedBool: boolean;
};

export const computeDealerApr = (input: DealerAprInputs): DealerAprOutputs => {
  if (input.noCredit) {
    return { apr: 0, monthly: 0, totalPaid: 0, interestPaid: 0, approvedBool: false };
  }
  const score = input.creditScore ?? 0;
  const apr = score >= 720 ? 0.12 : score >= 660 ? 0.195 : 0.27;
  const years = parseInt(input.term, 10);
  const months = years * 12;
  const monthlyRate = apr / 12;
  const monthly = Math.round(
    (input.listingPrice * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months)),
  );
  const totalPaid = monthly * months;
  return {
    apr,
    monthly,
    totalPaid,
    interestPaid: totalPaid - input.listingPrice,
    approvedBool: score >= 580,
  };
};

export const quotePath = async (
  path: PathKind,
  listing: ListingObject,
  intake: IntakeState,
): Promise<PathQuote> => {
  return makeFixturePathQuote({
    path,
    titleStatus: listing.titleStatus,
    term: intake.selectedTerm,
    total: listing.price ?? listing.currentBid ?? 20000,
  });
};

export const quoteAllPaths = async (
  listing: ListingObject,
  intake: IntakeState,
): Promise<PathQuote[]> => {
  const paths: PathKind[] = ["dealer", "auction", "picknbuild", "private"];
  return Promise.all(paths.map((p) => quotePath(p, listing, intake)));
};

export const estimateTradeInValue = async (input: {
  vin: string;
  titleStatus: "clean" | "rebuilt";
}): Promise<{ estimatedTradeInValue: number }> => ({
  estimatedTradeInValue: input.titleStatus === "clean" ? 8500 : 5500,
});

export type AlreadyHaveACarEstimate =
  | { ok: true; estimate: number; assumptions: string[] }
  | { ok: false; reason: "quote-required" };

export const estimateAlreadyHaveACar = async (input: {
  vin?: string;
  fallback?: {
    year: number;
    make: string;
    model: string;
    mileage?: number;
    trim?: string;
  };
  requestedWork: string[];
}): Promise<AlreadyHaveACarEstimate> => ({
  ok: true,
  estimate: 4500,
  assumptions: ["Parts availability stable", "No frame damage"],
});
