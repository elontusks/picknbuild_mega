export type ConversionState =
  | "decided"
  | "payment-initiated"
  | "deposit-received"
  | "post-deposit";

export const CONVERSION_STATE_ORDER: ConversionState[] = [
  "decided",
  "payment-initiated",
  "deposit-received",
  "post-deposit",
];

export const canTransition = (
  from: ConversionState,
  to: ConversionState,
): boolean => {
  const fromIdx = CONVERSION_STATE_ORDER.indexOf(from);
  const toIdx = CONVERSION_STATE_ORDER.indexOf(to);
  return toIdx === fromIdx + 1;
};
