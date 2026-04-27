import type { ListingObject, ListingSource } from "@/contracts";
import type { Car, CarPath, Condition, Effort, Risk } from "./types";

const SOURCE_TO_PATH: Record<ListingSource, CarPath> = {
  dealer: "dealer",
  copart: "auction",
  iaai: "auction",
  craigslist: "individual",
  user: "individual",
  "parsed-link": "individual",
  // Firecrawl-driven adapters (Cars.com today, plus dealer sites / BaT) surface
  // dealer-listed used inventory. Bucket as "dealer" so those rows actually
  // show up instead of being dropped on unrecognized-path.
  firecrawl: "dealer",
};

const SOURCE_TO_EFFORT: Record<ListingSource, Effort> = {
  dealer: "low",
  copart: "high",
  iaai: "high",
  craigslist: "medium",
  user: "medium",
  "parsed-link": "medium",
  firecrawl: "low",
};

const SOURCE_TO_RISK: Record<ListingSource, Risk> = {
  dealer: "low",
  copart: "high",
  iaai: "high",
  craigslist: "medium",
  user: "medium",
  "parsed-link": "medium",
  firecrawl: "low",
};

function deriveCondition(listing: ListingObject): Condition {
  if (listing.titleStatus === "rebuilt") return "fair";
  if (listing.titleStatus === "clean") {
    if (typeof listing.mileage === "number" && listing.mileage < 30_000) {
      return "excellent";
    }
    return "good";
  }
  return "good";
}

function pickPrice(listing: ListingObject): number {
  return (
    listing.price ??
    listing.binPrice ??
    listing.currentBid ??
    listing.estimatedMarketValue ??
    0
  );
}

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function buildExplanation(listing: ListingObject, price: number): string {
  const priceLabel = price > 0 ? formatUsd(price) : "price TBD";
  switch (listing.source) {
    case "dealer":
      return `Dealer listing at ${priceLabel}.`;
    case "copart":
      return `Copart auction at ${priceLabel} — bidding + repairs on you.`;
    case "iaai":
      return `IAAI auction at ${priceLabel} — bidding + repairs on you.`;
    case "craigslist":
      return `Craigslist listing at ${priceLabel} — direct from seller.`;
    case "user":
      return `Private seller listing at ${priceLabel}.`;
    case "parsed-link":
      return `Pasted listing at ${priceLabel} — verify with seller.`;
    case "firecrawl":
      return `Dealer-site listing at ${priceLabel}.`;
  }
}

/**
 * Map a ListingObject from team-03-supply into the Car shape the demo
 * columns consume. Conservative on derived fields — totalCost/acv fall back
 * through price → binPrice → currentBid → estimatedMarketValue → 0 so the
 * existing pricing math has a non-zero base to work with.
 */
export function listingToCar(listing: ListingObject): Car {
  const price = pickPrice(listing);
  const path = SOURCE_TO_PATH[listing.source];
  const condition = deriveCondition(listing);
  const photo = listing.photos[0] ?? "/placeholder-car.svg";
  const carTitleStatus = listing.titleStatus === "unknown" ? undefined : listing.titleStatus;

  return {
    id: listing.id,
    listingId: listing.id,
    make: listing.make,
    model: listing.model,
    year: listing.year,
    trim: listing.trim ?? "",
    image: photo,
    gallery: listing.photos.length > 0 ? listing.photos : undefined,
    mileage: listing.mileage ?? 0,
    condition,
    location: listing.locationZip ?? "",
    path,
    downPayment: 0,
    monthlyPayment: 0,
    totalCost: price,
    acv: price,
    availability: "Available",
    effort: SOURCE_TO_EFFORT[listing.source],
    risk: SOURCE_TO_RISK[listing.source],
    fees: listing.fees ?? 0,
    source: listing.source,
    explanation: buildExplanation(listing, price),
    titleStatus: carTitleStatus,
  };
}

/**
 * The picknbuild column shows the dealer + auction pool restricted to
 * clean-title vehicles. Listings without a clean title are excluded.
 * Firecrawl-driven dealer-side rows (Cars.com et al.) are eligible too.
 */
export function isPicknbuildEligible(listing: ListingObject): boolean {
  if (listing.titleStatus !== "clean") return false;
  return (
    listing.source === "dealer" ||
    listing.source === "copart" ||
    listing.source === "iaai" ||
    listing.source === "firecrawl"
  );
}
