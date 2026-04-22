import type { Condition } from "../types";

export const ownsResource: Condition = (p, r) => {
  if (!r) {
    return { passed: false, reason: "Resource required for ownership check." };
  }

  const ownerMatch = !!r.owner_id && r.owner_id === p.id;
  const dealerMatch =
    !!r.dealer_page_id &&
    !!p.dealer?.page_id &&
    r.dealer_page_id === p.dealer.page_id;

  if (ownerMatch || dealerMatch) return { passed: true };

  if (!r.owner_id && !r.dealer_page_id) {
    return { passed: false, reason: "Resource has no owner." };
  }
  return { passed: false, reason: "You do not own this resource." };
};
