import type { DealStatus } from "@/contracts";

// Human copy for Status Timeline + Post-Conversion Status View. Order matches
// the forward flow in `team-12-workflows.ts`: build-started → sourcing →
// purchased → in-transit → delivered. Terminal branches are rendered
// separately.
export const DEAL_STATUS_FLOW: DealStatus[] = [
  "build-started",
  "sourcing",
  "purchased",
  "in-transit",
  "delivered",
];

const LABELS: Record<DealStatus, string> = {
  "build-started": "Build started",
  sourcing: "Sourcing your car",
  purchased: "Vehicle purchased",
  "in-transit": "In transit",
  delivered: "Delivered",
  surrendered: "Surrendered",
  cancelled: "Cancelled",
};

// Full DealStatus vocabulary, including terminal branches. DEAL_STATUS_FLOW
// above is the happy-path subset used by the progress view; callers that
// need to recognize *any* DealStatus (e.g. Status Timeline humanizing an
// arbitrary stage string) should use this one.
export const DEAL_STATUSES = Object.keys(LABELS) as DealStatus[];

export const humanizeDealStatus = (s: DealStatus): string => LABELS[s];

const DESCRIPTIONS: Record<DealStatus, string> = {
  "build-started": "Your deposit cleared — we're kicking off your build.",
  sourcing: "We're actively locating a vehicle that matches your committed spec.",
  purchased: "A matching vehicle has been acquired on your behalf.",
  "in-transit": "The vehicle is on its way to you.",
  delivered: "Delivery complete. Welcome to your new ride.",
  surrendered: "You surrendered this build. The deposit was not refunded.",
  cancelled: "This deal was cancelled before delivery.",
};

export const describeDealStatus = (s: DealStatus): string => DESCRIPTIONS[s];
