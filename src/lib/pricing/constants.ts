export const DEFAULT_TAX_RATE = 0.07;

export const DEFAULT_DEALER_DOC_FEES = 499;
export const DEFAULT_PICKNBUILD_FEES = 750;
export const DEFAULT_PRIVATE_TRANSFER_FEES = 85;

export const AUCTION_BUYER_FEE_RATE = 0.12;
export const AUCTION_TRANSPORT_ESTIMATE = 900;
export const AUCTION_REPAIR_BUFFER = 1500;

export const REBUILT_VEHICLE_DISCOUNT = 0.12;

export const PICKNBUILD_MIN_MONTHLY_EQUIVALENT = 500;

export const DEALER_APR_TIERS = {
  prime: { min: 720, rate: 0.12 },
  nearPrime: { min: 621, rate: 0.195 },
  subprime: { min: 0, rate: 0.27 },
} as const;

export const DEALER_MIN_APPROVABLE_SCORE = 580;
