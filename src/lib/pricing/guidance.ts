import type { ListingObject, PathKind } from "@/contracts";

export type PricingGuidanceVerdict = "low" | "fair" | "high";

export type PricingGuidance = {
  verdict: PricingGuidanceVerdict;
  reasonLine: string;
  marketRange?: [number, number];
  negotiationAnchor?: number;
};

const LOW_THRESHOLD = 0.92;
const HIGH_THRESHOLD = 1.08;

const marketAnchorPrice = (listing: ListingObject): number => {
  if (listing.estimatedMarketValue !== undefined) return listing.estimatedMarketValue;
  if (listing.price !== undefined) return listing.price;
  if (listing.binPrice !== undefined) return listing.binPrice;
  if (listing.currentBid !== undefined) return Math.round(listing.currentBid * 1.25);
  return 0;
};

const askingPrice = (listing: ListingObject, path: PathKind): number => {
  if (path === "auction") return listing.currentBid ?? listing.binPrice ?? 0;
  return listing.price ?? listing.binPrice ?? listing.currentBid ?? 0;
};

const reasonLineFor = (
  verdict: PricingGuidanceVerdict,
  path: PathKind,
  listing: ListingObject,
): string => {
  const base = (() => {
    switch (path) {
      case "dealer":
        return "Dealer price before APR, fees, and add-ons";
      case "auction":
        return "Current bid before fees, transport, and repairs";
      case "picknbuild":
        return "Total before customizations and credit-tier down";
      case "private":
        return "Seller ask before tax, title transfer, and inspection";
    }
  })();
  const titleNote =
    listing.titleStatus === "rebuilt"
      ? " Rebuilt title discount is already reflected in expected range."
      : "";
  switch (verdict) {
    case "low":
      return `${base} — comes in below comparable listings.${titleNote}`;
    case "high":
      return `${base} — runs above comparable listings.${titleNote}`;
    case "fair":
      return `${base} — inside the comparable-listings range.${titleNote}`;
  }
};

export const getPricingGuidance = (input: {
  listing: ListingObject;
  path: PathKind;
}): PricingGuidance => {
  const anchor = marketAnchorPrice(input.listing);
  const ask = askingPrice(input.listing, input.path);
  if (anchor === 0 || ask === 0) {
    return {
      verdict: "fair",
      reasonLine: "Not enough market data to judge this one yet.",
    };
  }
  const ratio = ask / anchor;
  const verdict: PricingGuidanceVerdict =
    ratio < LOW_THRESHOLD ? "low" : ratio > HIGH_THRESHOLD ? "high" : "fair";

  const marketRange: [number, number] = [
    Math.round(anchor * 0.9),
    Math.round(anchor * 1.1),
  ];
  const negotiationAnchor =
    verdict === "low" ? undefined : Math.round(anchor * (verdict === "high" ? 0.94 : 0.97));

  return {
    verdict,
    reasonLine: reasonLineFor(verdict, input.path, input.listing),
    marketRange,
    negotiationAnchor,
  };
};
