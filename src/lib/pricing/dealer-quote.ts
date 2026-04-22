import type { PathQuote, Term, TitleStatus } from "@/contracts";
import {
  DEALER_APR_TIERS,
  DEALER_MIN_APPROVABLE_SCORE,
  DEFAULT_DEALER_DOC_FEES,
  DEFAULT_TAX_RATE,
  REBUILT_VEHICLE_DISCOUNT,
} from "./constants";
import { isFinancedTerm, termToMonths, type FinancedTerm } from "./term-cadence";

export type DealerAprInputs = {
  creditScore?: number;
  noCredit?: boolean;
  listingPrice: number;
  tax?: number;
  fees?: number;
  titleStatus?: TitleStatus;
  tradeInValue?: number;
  term: Term;
};

export type DealerAprOutputs = {
  apr: number;
  monthly: number;
  totalPaid: number;
  interestPaid: number;
  approvedBool: boolean;
  down: number;
  financedAmount: number;
  total: number;
  term: Term;
};

const resolveApr = (score: number): number => {
  if (score >= DEALER_APR_TIERS.prime.min) return DEALER_APR_TIERS.prime.rate;
  if (score >= DEALER_APR_TIERS.nearPrime.min) return DEALER_APR_TIERS.nearPrime.rate;
  return DEALER_APR_TIERS.subprime.rate;
};

const amortizedMonthly = (principal: number, apr: number, months: number): number => {
  if (months <= 0) return 0;
  if (apr === 0) return principal / months;
  const monthlyRate = apr / 12;
  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
};

// Dealer typical standard 10% down for financed buys; cash term = 0 down required up-front for financing calc
const STANDARD_DEALER_DOWN_PCT = 0.1;

const applyRebuilt = (price: number, title?: TitleStatus) =>
  title === "rebuilt" ? price * (1 - REBUILT_VEHICLE_DISCOUNT) : price;

export const computeDealerApr = (input: DealerAprInputs): DealerAprOutputs => {
  const adjustedPrice = applyRebuilt(input.listingPrice, input.titleStatus);
  const tax = input.tax ?? Math.round(adjustedPrice * DEFAULT_TAX_RATE);
  const fees = input.fees ?? DEFAULT_DEALER_DOC_FEES;
  const allIn = adjustedPrice + tax + fees - (input.tradeInValue ?? 0);
  const total = Math.max(0, Math.round(allIn));

  if (input.noCredit) {
    return {
      apr: 0,
      monthly: 0,
      totalPaid: total,
      interestPaid: 0,
      approvedBool: false,
      down: 0,
      financedAmount: 0,
      total,
      term: input.term,
    };
  }

  const score = input.creditScore ?? 0;
  const approved = score >= DEALER_MIN_APPROVABLE_SCORE;

  if (!isFinancedTerm(input.term)) {
    return {
      apr: 0,
      monthly: 0,
      totalPaid: total,
      interestPaid: 0,
      approvedBool: approved,
      down: total,
      financedAmount: 0,
      total,
      term: input.term,
    };
  }

  const apr = resolveApr(score);
  const down = Math.round(total * STANDARD_DEALER_DOWN_PCT);
  const financed = Math.max(0, total - down);
  const months = termToMonths(input.term as FinancedTerm);
  const monthly = Math.round(amortizedMonthly(financed, apr, months));
  const totalPaid = Math.round(down + monthly * months);
  const interestPaid = Math.max(0, totalPaid - total);

  return {
    apr,
    monthly: approved ? monthly : 0,
    totalPaid: approved ? totalPaid : total,
    interestPaid: approved ? interestPaid : 0,
    approvedBool: approved,
    down: approved ? down : 0,
    financedAmount: approved ? financed : 0,
    total,
    term: input.term,
  };
};

export const buildDealerPathQuote = (input: DealerAprInputs): PathQuote => {
  const q = computeDealerApr(input);
  const title: TitleStatus = input.titleStatus ?? "unknown";

  const barrierLine = input.noCredit
    ? "Most likely not approved without credit. Dealer financing usually requires approval."
    : q.approvedBool
      ? isFinancedTerm(input.term)
        ? `Needs ~${Math.round(STANDARD_DEALER_DOWN_PCT * 100)}% down ($${q.down.toLocaleString()}) + credit approval at ${(q.apr * 100).toFixed(1)}% APR.`
        : `Pays $${q.total.toLocaleString()} cash at signing.`
      : "Credit below dealer approval threshold.";

  return {
    path: "dealer",
    total: q.total,
    down: isFinancedTerm(input.term) ? q.down : undefined,
    monthly: isFinancedTerm(input.term) && q.approvedBool ? q.monthly : undefined,
    apr: isFinancedTerm(input.term) && q.approvedBool ? q.apr : undefined,
    term: input.term,
    approvedBool: q.approvedBool,
    barrierLine,
    titleStatus: title,
  };
};
