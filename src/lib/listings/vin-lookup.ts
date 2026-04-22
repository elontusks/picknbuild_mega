import type { TitleStatus } from "@/contracts";
import { normalizeVin } from "./normalizer";

export type VinLookupResult = {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileage?: number;
  titleStatus?: TitleStatus;
};

export type VinLookupError =
  | { ok: false; reason: "invalid-vin" }
  | { ok: false; reason: "not-found" };

export type VinLookupResponse =
  | { ok: true; result: VinLookupResult }
  | VinLookupError;

/**
 * World Manufacturer Identifier (first 3 chars of a VIN) → make. This is a
 * tiny seeded slice — the real product uses NHTSA's vPIC API or a commercial
 * VIN decoder, but that integration is out of scope here. The Trade-In Flow
 * and Already-Have-a-Car Flow (Team 11) call this to pre-fill year/make/model
 * so the user doesn't retype. Unknown WMIs return `not-found`; the caller
 * falls back to manual entry.
 */
const WMI_TABLE: Record<string, { make: string; model: string }> = {
  "1HG": { make: "Honda", model: "Accord" },
  "2HG": { make: "Honda", model: "Civic" },
  "JHM": { make: "Honda", model: "Accord" },
  "JH4": { make: "Acura", model: "Integra" },
  "5YJ": { make: "Tesla", model: "Model S" },
  "7SA": { make: "Tesla", model: "Model Y" },
  "1FT": { make: "Ford", model: "F-150" },
  "1FA": { make: "Ford", model: "Mustang" },
  "4T1": { make: "Toyota", model: "Camry" },
  "5TF": { make: "Toyota", model: "Tacoma" },
  "JTM": { make: "Toyota", model: "Highlander" },
  "WBA": { make: "BMW", model: "3 Series" },
  "WAU": { make: "Audi", model: "A4" },
  "JF1": { make: "Subaru", model: "WRX" },
  "4S4": { make: "Subaru", model: "Outback" },
  "1G1": { make: "Chevrolet", model: "Malibu" },
  "1GC": { make: "Chevrolet", model: "Silverado" },
  "1N4": { make: "Nissan", model: "Altima" },
};

/**
 * Year codes for position 10 of a VIN. Simplified — covers 2010-2030 which is
 * the window that matters for used-car inventory.
 */
const YEAR_CODE_TABLE: Record<string, number> = {
  A: 2010, B: 2011, C: 2012, D: 2013, E: 2014,
  F: 2015, G: 2016, H: 2017, J: 2018, K: 2019,
  L: 2020, M: 2021, N: 2022, P: 2023, R: 2024,
  S: 2025, T: 2026, V: 2027, W: 2028, X: 2029, Y: 2030,
};

export const decodeVinYear = (vin: string): number | undefined => {
  const normalized = normalizeVin(vin);
  if (!normalized) return undefined;
  const code = normalized.charAt(9);
  return YEAR_CODE_TABLE[code];
};

export const decodeVinMake = (vin: string): { make: string; model: string } | undefined => {
  const normalized = normalizeVin(vin);
  if (!normalized) return undefined;
  const wmi = normalized.slice(0, 3);
  return WMI_TABLE[wmi];
};

export const lookupVin = (rawVin: string): VinLookupResponse => {
  const vin = normalizeVin(rawVin);
  if (!vin) return { ok: false, reason: "invalid-vin" };

  const make = decodeVinMake(vin);
  const year = decodeVinYear(vin);
  if (!make || !year) return { ok: false, reason: "not-found" };

  return {
    ok: true,
    result: {
      vin,
      year,
      make: make.make,
      model: make.model,
    },
  };
};
