import type { ListingObject, PathQuote, TitleStatus } from "@/contracts";
import { DEFAULT_PRIVATE_TRANSFER_FEES, DEFAULT_TAX_RATE } from "./constants";

export type PrivateQuoteInputs = {
  listing: Pick<ListingObject, "price" | "titleStatus">;
  tax?: number;
  transferFees?: number;
};

export type PrivateQuoteOutputs = {
  ask: number;
  tax: number;
  transferFees: number;
  total: number;
};

export const computePrivateQuote = (
  input: PrivateQuoteInputs,
): PrivateQuoteOutputs => {
  const ask = input.listing.price ?? 0;
  const tax = input.tax ?? Math.round(ask * DEFAULT_TAX_RATE);
  const transferFees = input.transferFees ?? DEFAULT_PRIVATE_TRANSFER_FEES;
  const total = Math.round(ask + tax + transferFees);
  return { ask, tax, transferFees, total };
};

export const buildPrivatePathQuote = (input: PrivateQuoteInputs): PathQuote => {
  const q = computePrivateQuote(input);
  const title: TitleStatus = input.listing.titleStatus ?? "unknown";
  const barrierLine = `Pay seller direct: $${q.total.toLocaleString()} cash. No financing, no protection — inspect yourself.`;
  return {
    path: "private",
    total: q.total,
    approvedBool: true,
    barrierLine,
    titleStatus: title,
  };
};
