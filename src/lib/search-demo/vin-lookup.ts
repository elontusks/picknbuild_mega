// Free-tier VIN trade-in flow:
//   1. decodeVin()  → live NHTSA vPIC API call (no key, ~5s timeout).
//   2. estimateTradeInFromDecode() → depreciation curve over (year, mileage, title).
//
// We can't hit KBB/MMR/Edmunds/Black Book without paid contracts, so the
// "estimated value" is intentionally an approximation built from a midline
// MSRP keyed off make-tier, depreciated by age + mileage, then haircut for a
// rebuilt title. Always disclose to the user that this is a rough estimate.
//
// NHTSA endpoint: https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/{VIN}?format=json
// (DecodeVinValuesExtended returns a single flat object per VIN with fields like
// ModelYear, Make, Model, Trim, BodyClass, etc.)

import type { TitleType } from "./types";

export type VinDecoded = {
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  bodyClass?: string;
};

const NHTSA_URL =
  "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended";
const DECODE_TIMEOUT_MS = 5_000;

const VIN_LENGTH = 17;
const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/i;

/**
 * Decode a 17-character VIN using NHTSA's free vPIC API. Returns null on any
 * network error, timeout, HTTP error, or empty result. NHTSA accepts shorter
 * VINs for partial decoding, but the trade-in form requires a full one — we
 * reject anything that isn't 17 valid VIN chars.
 */
export async function decodeVin(vin: string): Promise<VinDecoded | null> {
  if (!vin || vin.length !== VIN_LENGTH || !VIN_PATTERN.test(vin)) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DECODE_TIMEOUT_MS);

  try {
    const url = `${NHTSA_URL}/${encodeURIComponent(vin.toUpperCase())}?format=json`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;

    const json = (await res.json()) as {
      Results?: Array<Record<string, unknown>>;
    };
    const row = json?.Results?.[0];
    if (!row) return null;

    const yearRaw = row["ModelYear"];
    const yearNum =
      typeof yearRaw === "string" && yearRaw.trim() !== ""
        ? Number.parseInt(yearRaw, 10)
        : typeof yearRaw === "number"
          ? yearRaw
          : Number.NaN;

    const decoded: VinDecoded = {};
    if (Number.isFinite(yearNum) && yearNum > 1900) decoded.year = yearNum;
    const make = stringField(row["Make"]);
    if (make) decoded.make = make;
    const model = stringField(row["Model"]);
    if (model) decoded.model = model;
    const trim = stringField(row["Trim"]);
    if (trim) decoded.trim = trim;
    const bodyClass = stringField(row["BodyClass"]);
    if (bodyClass) decoded.bodyClass = bodyClass;

    // NHTSA always returns a row but may leave every meaningful field empty
    // for a bogus VIN — treat that as a decode failure.
    if (
      decoded.year === undefined &&
      decoded.make === undefined &&
      decoded.model === undefined
    ) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

function stringField(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed.toLowerCase() === "not applicable") {
    return undefined;
  }
  return trimmed;
}

// Make → MSRP tier (very rough midline used as the depreciation anchor).
//   cheap   = $22,000
//   midline = $30,000
//   premium = $50,000
//   luxury  = $70,000
const MAKE_TIER: Record<string, "cheap" | "midline" | "premium" | "luxury"> = {
  // cheap (econoboxes / value brands)
  hyundai: "cheap",
  kia: "cheap",
  mitsubishi: "cheap",
  nissan: "cheap",
  fiat: "cheap",
  smart: "cheap",
  suzuki: "cheap",
  // midline (mainstream brands)
  honda: "midline",
  toyota: "midline",
  ford: "midline",
  chevrolet: "midline",
  gmc: "midline",
  mazda: "midline",
  subaru: "midline",
  volkswagen: "midline",
  jeep: "midline",
  ram: "midline",
  dodge: "midline",
  chrysler: "midline",
  buick: "midline",
  mini: "midline",
  // premium (entry-luxury, performance, near-lux)
  acura: "premium",
  infiniti: "premium",
  lexus: "premium",
  volvo: "premium",
  lincoln: "premium",
  cadillac: "premium",
  audi: "premium",
  bmw: "premium",
  "mercedes-benz": "premium",
  mercedes: "premium",
  genesis: "premium",
  tesla: "premium",
  // luxury (full-luxury and exotic)
  porsche: "luxury",
  jaguar: "luxury",
  "land rover": "luxury",
  landrover: "luxury",
  maserati: "luxury",
  bentley: "luxury",
  ferrari: "luxury",
  lamborghini: "luxury",
  "rolls-royce": "luxury",
  rollsroyce: "luxury",
  "aston martin": "luxury",
  astonmartin: "luxury",
  mclaren: "luxury",
};

const TIER_MSRP: Record<"cheap" | "midline" | "premium" | "luxury", number> = {
  cheap: 22_000,
  midline: 30_000,
  premium: 50_000,
  luxury: 70_000,
};

const REBUILT_HAIRCUT = 0.35;
const MILEAGE_BASELINE = 60_000;
const MILEAGE_PENALTY_PER_MILE = 0.08;

/**
 * Depreciation formula:
 *   value = msrp(make_tier) * yearFactor(age) * (1 - 0.35 if rebuilt)
 *           - max(0, mileage - 60_000) * 0.08
 * yearFactor: 1.0 (new), 0.80 (1y), 0.68 (2y), 0.58 (3y), then linear ~5%/yr to a 0.15 floor.
 * Rounded to nearest $250, never negative.
 */
export function estimateTradeInFromDecode(
  decoded: VinDecoded | null,
  mileage: number,
  titleType: TitleType,
): number {
  if (!decoded) return 0;

  const makeKey = (decoded.make ?? "").trim().toLowerCase();
  const tier = MAKE_TIER[makeKey] ?? "midline";
  const msrp = TIER_MSRP[tier];

  const currentYear = new Date().getUTCFullYear();
  const age =
    decoded.year && decoded.year > 1900
      ? Math.max(0, currentYear - decoded.year)
      : 8; // unknown year → assume an ~8yr-old car
  const yearFactor = depreciationFactorForAge(age);

  let value = msrp * yearFactor;
  if (titleType === "rebuilt") {
    value = value * (1 - REBUILT_HAIRCUT);
  }

  const safeMileage = Number.isFinite(mileage) && mileage >= 0 ? mileage : MILEAGE_BASELINE;
  const overMiles = Math.max(0, safeMileage - MILEAGE_BASELINE);
  value = value - overMiles * MILEAGE_PENALTY_PER_MILE;

  if (value < 0) value = 0;
  return Math.round(value / 250) * 250;
}

function depreciationFactorForAge(age: number): number {
  // Steeper drop in years 1–3, then ~5%/yr until a 0.15 floor.
  if (age <= 0) return 1.0;
  if (age === 1) return 0.8;
  if (age === 2) return 0.68;
  if (age === 3) return 0.58;
  // Years 4+ : linear 5% per additional year off the year-3 anchor.
  const factor = 0.58 - (age - 3) * 0.05;
  return Math.max(0.15, factor);
}
