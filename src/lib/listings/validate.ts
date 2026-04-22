import type { TitleStatus } from "@/contracts";
import { normalizeVin } from "./normalizer";

export type ListingFormInput = {
  year?: number | string;
  make?: string;
  model?: string;
  trim?: string;
  mileage?: number | string;
  price?: number | string;
  vin?: string;
  titleStatus?: TitleStatus;
  locationZip?: string;
  photos?: string[];
  sourceUrl?: string;
};

export type ListingFormValidated = {
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileage?: number;
  price?: number;
  vin?: string;
  titleStatus: TitleStatus;
  locationZip?: string;
  photos: string[];
  sourceUrl?: string;
};

export type ListingFormValidation =
  | { ok: true; value: ListingFormValidated }
  | { ok: false; error: string; field: keyof ListingFormInput | "sourceUrl" };

const asNumber = (v: number | string | undefined): number | undefined => {
  if (v === undefined || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : NaN;
};

const ALLOWED_TITLES: TitleStatus[] = ["clean", "rebuilt", "unknown"];

/**
 * Validates the shared listing-form body used by both the dealer-posted form
 * and the user-generated upload. Pure — no I/O — so the REST handlers and
 * the client-side form share one set of rules.
 */
export const validateListingForm = (input: ListingFormInput): ListingFormValidation => {
  const year = asNumber(input.year);
  if (year === undefined || Number.isNaN(year) || !Number.isInteger(year) || year < 1950 || year > 2100) {
    return { ok: false, error: "Year must be between 1950 and 2100.", field: "year" };
  }
  const make = input.make?.trim();
  if (!make) return { ok: false, error: "Make is required.", field: "make" };
  const model = input.model?.trim();
  if (!model) return { ok: false, error: "Model is required.", field: "model" };

  const mileage = asNumber(input.mileage);
  if (mileage !== undefined && (Number.isNaN(mileage) || mileage < 0 || mileage > 1_000_000)) {
    return { ok: false, error: "Mileage must be between 0 and 1,000,000.", field: "mileage" };
  }

  const price = asNumber(input.price);
  if (price !== undefined && (Number.isNaN(price) || price < 0)) {
    return { ok: false, error: "Price must be a non-negative number.", field: "price" };
  }

  const titleStatus = input.titleStatus ?? "unknown";
  if (!ALLOWED_TITLES.includes(titleStatus)) {
    return { ok: false, error: "Invalid title status.", field: "titleStatus" };
  }

  let vin: string | undefined;
  if (input.vin && input.vin.trim().length > 0) {
    vin = normalizeVin(input.vin);
    if (!vin) return { ok: false, error: "VIN must be 17 characters (no I/O/Q).", field: "vin" };
  }

  const locationZip = input.locationZip?.trim();
  if (locationZip && !/^\d{5}$/.test(locationZip)) {
    return { ok: false, error: "ZIP must be a 5-digit code.", field: "locationZip" };
  }

  const sourceUrl = input.sourceUrl?.trim();
  if (sourceUrl) {
    try {
      new URL(sourceUrl);
    } catch {
      return { ok: false, error: "sourceUrl must be a valid URL.", field: "sourceUrl" };
    }
  }

  return {
    ok: true,
    value: {
      year,
      make,
      model,
      trim: input.trim?.trim() || undefined,
      mileage: mileage === undefined ? undefined : mileage,
      price: price === undefined ? undefined : price,
      vin,
      titleStatus,
      locationZip: locationZip || undefined,
      photos: (input.photos ?? []).map((p) => p.trim()).filter(Boolean),
      sourceUrl: sourceUrl || undefined,
    },
  };
};
