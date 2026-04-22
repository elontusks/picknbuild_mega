export const formatUsd = (amount: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);

export const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const humanizeKind = (
  kind:
    | "deposit"
    | "subscription"
    | "lead-unlock"
    | "listing-fee"
    | "refund"
    | "balance",
): string => {
  switch (kind) {
    case "deposit":
      return "Deposit";
    case "subscription":
      return "Subscription";
    case "lead-unlock":
      return "Lead unlock";
    case "listing-fee":
      return "Listing fee";
    case "refund":
      return "Refund";
    case "balance":
      return "Balance payment";
  }
};
