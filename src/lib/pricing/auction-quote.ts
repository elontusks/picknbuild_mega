import type { ListingObject, PathQuote, TitleStatus } from "@/contracts";
import {
  AUCTION_BUYER_FEE_RATE,
  AUCTION_REPAIR_BUFFER,
  AUCTION_TRANSPORT_ESTIMATE,
} from "./constants";

export type AuctionQuoteInputs = {
  listing: Pick<
    ListingObject,
    "currentBid" | "binPrice" | "fees" | "estimatedMarketValue" | "titleStatus"
  >;
  transportEstimate?: number;
  repairBuffer?: number;
};

export type AuctionQuoteOutputs = {
  bid: number;
  buyerFee: number;
  transport: number;
  repairBuffer: number;
  total: number;
};

const pickBid = (listing: AuctionQuoteInputs["listing"]): number =>
  listing.binPrice ?? listing.currentBid ?? listing.estimatedMarketValue ?? 0;

export const computeAuctionQuote = (
  input: AuctionQuoteInputs,
): AuctionQuoteOutputs => {
  const bid = pickBid(input.listing);
  const listingFees = input.listing.fees ?? Math.round(bid * AUCTION_BUYER_FEE_RATE);
  const transport = input.transportEstimate ?? AUCTION_TRANSPORT_ESTIMATE;
  const repairs = input.repairBuffer ?? AUCTION_REPAIR_BUFFER;
  const total = Math.round(bid + listingFees + transport + repairs);
  return { bid, buyerFee: listingFees, transport, repairBuffer: repairs, total };
};

export const buildAuctionPathQuote = (input: AuctionQuoteInputs): PathQuote => {
  const q = computeAuctionQuote(input);
  const title: TitleStatus = input.listing.titleStatus ?? "unknown";
  const barrierLine = `Cash ($${q.total.toLocaleString()} est. all-in) + buyer handles transport, repairs, unknown condition.`;
  return {
    path: "auction",
    total: q.total,
    approvedBool: true,
    barrierLine,
    titleStatus: title,
  };
};
