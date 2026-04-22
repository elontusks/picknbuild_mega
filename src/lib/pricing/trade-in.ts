import type { TitleStatus } from "@/contracts";
import { REBUILT_VEHICLE_DISCOUNT } from "./constants";

export type TradeInInputs = {
  vin: string;
  titleStatus: Extract<TitleStatus, "clean" | "rebuilt">;
  year?: number;
  mileage?: number;
};

export type TradeInEstimate = {
  estimatedTradeInValue: number;
  baseValue: number;
  titleAdjustment: number;
  mileagePenalty: number;
};

const BASE_BY_AGE: ReadonlyArray<readonly [maxAgeYears: number, base: number]> = [
  [3, 15000],
  [7, 10500],
  [12, 7500],
  [20, 4500],
] as const;

const AGE_FLOOR = 1500;

const resolveBaseByYear = (year?: number): number => {
  if (year === undefined) return 7500;
  const age = new Date().getUTCFullYear() - year;
  for (const [maxAge, base] of BASE_BY_AGE) {
    if (age <= maxAge) return base;
  }
  return AGE_FLOOR;
};

const resolveMileagePenalty = (base: number, mileage?: number): number => {
  if (mileage === undefined) return 0;
  const over = Math.max(0, mileage - 100000);
  return Math.min(base * 0.3, Math.round((over / 10000) * base * 0.03));
};

export const estimateTradeIn = (input: TradeInInputs): TradeInEstimate => {
  const base = resolveBaseByYear(input.year);
  const titleAdjustment =
    input.titleStatus === "rebuilt" ? -Math.round(base * REBUILT_VEHICLE_DISCOUNT) : 0;
  const mileagePenalty = resolveMileagePenalty(base, input.mileage);
  const value = Math.max(0, base + titleAdjustment - mileagePenalty);
  return {
    estimatedTradeInValue: Math.round(value),
    baseValue: base,
    titleAdjustment,
    mileagePenalty,
  };
};
