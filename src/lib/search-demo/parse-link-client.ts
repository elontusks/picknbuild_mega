'use client';

import type { ListingObject } from "@/contracts";
import type { Car, CarPath } from "./types";
import { listingToCar } from "./listing-to-car";

export type ParseLinkResult =
  | { ok: true; listing: ListingObject; car: Car }
  | { ok: false; reason: string };

/**
 * Client wrapper for the paste-a-link flow. POSTs to the real Team 3
 * parse-link service through the authenticated Next route, then maps the
 * persisted ListingObject into the demo Car shape so the columns can render
 * it directly. `pathOverride` lets a column treat the parsed listing as its
 * own path even when the natural mapping points elsewhere — e.g. the dealer
 * column's "already found a car" input.
 */
export async function parseLinkAndConvert(
  url: string,
  pathOverride?: CarPath,
): Promise<ParseLinkResult> {
  let response: Response;
  try {
    response = await fetch("/api/listings/parse-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
  } catch {
    return { ok: false, reason: "Network error contacting listing service." };
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    return { ok: false, reason: "Listing service returned an invalid response." };
  }

  if (!response.ok) {
    const reason =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : `Listing service error (${response.status}).`;
    return { ok: false, reason };
  }

  const listing =
    payload && typeof payload === "object" && "listing" in payload
      ? ((payload as { listing: ListingObject }).listing)
      : null;
  if (!listing) {
    return { ok: false, reason: "Listing service returned no listing." };
  }

  const car = listingToCar(listing);
  return {
    ok: true,
    listing,
    car: pathOverride ? { ...car, path: pathOverride } : car,
  };
}
