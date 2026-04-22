import type { PathKind } from "@/contracts";

export type ChecklistStage =
  | "before-contact"
  | "before-meeting"
  | "during-inspection"
  | "before-payment";

export type ChecklistItem = {
  id: string;
  label: string;
  stage: ChecklistStage;
  completed: boolean;
  critical?: boolean;
};

const COMMON_BEFORE_PAYMENT: Omit<ChecklistItem, "id">[] = [
  { label: "Payment structure understood", stage: "before-payment", completed: false, critical: true },
  { label: "Bill of sale ready", stage: "before-payment", completed: false },
];

const PATH_ITEMS: Record<PathKind, Omit<ChecklistItem, "id">[]> = {
  picknbuild: [
    { label: "Spec and package confirmed", stage: "before-contact", completed: false, critical: true },
    { label: "Customizations reviewed", stage: "before-contact", completed: false },
    { label: "Term and bi-weekly payment reviewed", stage: "before-meeting", completed: false },
    { label: "Non-refundable acknowledgement read", stage: "before-payment", completed: false, critical: true },
  ],
  dealer: [
    { label: "Credit approval readiness checked", stage: "before-contact", completed: false, critical: true },
    { label: "APR and total-paid reviewed", stage: "before-meeting", completed: false },
    { label: "Fees and add-ons itemized", stage: "before-meeting", completed: false },
    { label: "Title matches seller identity", stage: "before-payment", completed: false, critical: true },
  ],
  auction: [
    { label: "Auction rules reviewed", stage: "before-contact", completed: false, critical: true },
    { label: "Transport plan in place", stage: "before-meeting", completed: false, critical: true },
    { label: "Repair estimate budgeted", stage: "before-meeting", completed: false },
    { label: "Bid ceiling committed to", stage: "before-payment", completed: false, critical: true },
  ],
  private: [
    { label: "Seller identity verified", stage: "before-contact", completed: false, critical: true },
    { label: "Title verified (no lien)", stage: "before-meeting", completed: false, critical: true },
    { label: "Cold-start video reviewed", stage: "during-inspection", completed: false },
    { label: "Cash handling plan in place", stage: "before-payment", completed: false, critical: true },
  ],
};

export const buildChecklist = (input: {
  path: PathKind;
  listingId: string;
  userId: string;
}): ChecklistItem[] => {
  const pathItems = PATH_ITEMS[input.path];
  const combined = [...pathItems, ...COMMON_BEFORE_PAYMENT];
  return combined.map((it, i) => ({
    ...it,
    id: `chk_${input.path}_${input.listingId}_${i}`,
  }));
};

export const setChecklistItem = (
  items: ChecklistItem[],
  itemId: string,
  completed: boolean,
): ChecklistItem[] =>
  items.map((it) => (it.id === itemId ? { ...it, completed } : it));
