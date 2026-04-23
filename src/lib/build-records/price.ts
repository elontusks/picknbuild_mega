import type {
  BuildCustomizations,
  BuildRecord,
  PackageTier,
  Term,
  TitleStatus,
} from "@/contracts";
import { computePicknbuildPrice } from "@/services/team-11-pricing";
import {
  CUSTOMIZATION_PRICE,
  PACKAGE_BY_TIER,
  type CustomizationKey,
} from "./packages";

export type LivePriceInputs = {
  packageTier: PackageTier;
  customizations: BuildCustomizations;
  term: Term;
  titleStatus: TitleStatus;
  creditScore?: number;
  noCredit?: boolean;
  tradeInValue?: number;
};

export type LivePriceOutput = {
  total: number;
  down: number;
  biweekly: number;
  remaining: number;
  downPercentage: number;
  term: Term;
  customizationsTotal: number;
  basePrice: number;
};

const sumSelected = (c: BuildCustomizations): number => {
  const keys: CustomizationKey[] = ["wrap", "seats", "starlight", "paint"];
  return keys.reduce((sum, k) => sum + (c[k] ? CUSTOMIZATION_PRICE[k] : 0), 0);
};

export const quoteLivePrice = (input: LivePriceInputs): LivePriceOutput => {
  const pkg = PACKAGE_BY_TIER[input.packageTier];
  const customizationsTotal = sumSelected(input.customizations);
  const result = computePicknbuildPrice({
    basePrice: pkg.basePrice,
    customizationsTotal,
    titleStatus: input.titleStatus,
    creditScore: input.creditScore,
    noCredit: input.noCredit,
    tradeInValue: input.tradeInValue,
    term: input.term,
  });
  return {
    total: result.total,
    down: result.down,
    biweekly: result.biweekly,
    remaining: result.remaining,
    downPercentage: result.downPercentage,
    term: result.term,
    customizationsTotal,
    basePrice: pkg.basePrice,
  };
};

export const livePriceInputsFromBuild = (input: {
  build: BuildRecord;
  term: Term;
  titleStatus: TitleStatus;
  creditScore?: number;
  noCredit?: boolean;
}): LivePriceInputs => ({
  packageTier: input.build.selectedPackage ?? "standard",
  customizations: input.build.customizations,
  term: input.term,
  titleStatus: input.titleStatus,
  creditScore: input.creditScore,
  noCredit: input.noCredit,
  tradeInValue: input.build.tradeIn?.estimatedValue,
});
