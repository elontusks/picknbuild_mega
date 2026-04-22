import type { PathQuote, Term, TitleStatus } from "@/contracts";
import { resolveDownPaymentPercentage } from "./credit-tier";
import {
  DEFAULT_PICKNBUILD_FEES,
  DEFAULT_TAX_RATE,
  REBUILT_VEHICLE_DISCOUNT,
} from "./constants";
import { isFinancedTerm, termToBiweeklyCount } from "./term-cadence";

export type PicknbuildPriceInputs = {
  basePrice: number;
  tax?: number;
  fees?: number;
  customizationsTotal?: number;
  titleStatus: TitleStatus;
  creditScore?: number;
  noCredit?: boolean;
  tradeInValue?: number;
  term: Term;
};

export type PicknbuildPriceOutputs = {
  total: number;
  down: number;
  remaining: number;
  biweekly: number;
  downPercentage: number;
  term: Term;
};

const applyRebuiltDiscount = (price: number, title: TitleStatus): number =>
  title === "rebuilt" ? price * (1 - REBUILT_VEHICLE_DISCOUNT) : price;

const resolveTax = (basePrice: number, providedTax?: number): number =>
  providedTax ?? Math.round(basePrice * DEFAULT_TAX_RATE);

export const computePicknbuildPrice = (
  input: PicknbuildPriceInputs,
): PicknbuildPriceOutputs => {
  const adjustedBase = applyRebuiltDiscount(input.basePrice, input.titleStatus);
  const tax = resolveTax(adjustedBase, input.tax);
  const fees = input.fees ?? DEFAULT_PICKNBUILD_FEES;
  const vehiclePrice = adjustedBase + tax + fees;
  const totalBeforeTrade = vehiclePrice + (input.customizationsTotal ?? 0);
  const total = Math.max(0, totalBeforeTrade - (input.tradeInValue ?? 0));

  const downPercentage = resolveDownPaymentPercentage({
    creditScore: input.creditScore,
    noCredit: input.noCredit,
  });
  const down = Math.round(total * downPercentage);
  const remaining = Math.max(0, total - down);

  const biweekly = isFinancedTerm(input.term)
    ? Math.round(remaining / termToBiweeklyCount(input.term))
    : 0;

  return {
    total: Math.round(total),
    down,
    remaining: Math.round(remaining),
    biweekly,
    downPercentage,
    term: input.term,
  };
};

export const buildPicknbuildPathQuote = (
  input: PicknbuildPriceInputs,
): PathQuote => {
  const q = computePicknbuildPrice(input);
  const title: TitleStatus =
    input.titleStatus === "unknown" ? "unknown" : input.titleStatus;
  const approved = !input.noCredit;
  const barrierLine = approved
    ? `~${Math.round(q.downPercentage * 100)}% down ($${q.down.toLocaleString()}) + build time; insurance required.`
    : `No Credit locks you at ${Math.round(q.downPercentage * 100)}% down — $${q.down.toLocaleString()} up front.`;

  return {
    path: "picknbuild",
    total: q.total,
    down: q.down,
    biweekly: q.biweekly === 0 ? undefined : q.biweekly,
    term: input.term,
    approvedBool: true,
    barrierLine,
    titleStatus: title,
  };
};
