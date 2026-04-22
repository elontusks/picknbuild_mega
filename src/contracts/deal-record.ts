import { nextFixtureId, nowIso, type ISOTimestamp } from "./common";
import type { PackageTier } from "./build-record";
import type { Term } from "./intake-state";

export type DealStatus =
  | "build-started"
  | "sourcing"
  | "purchased"
  | "in-transit"
  | "delivered"
  | "surrendered"
  | "cancelled";

export type DealCommittedSpec = {
  makeModelYearRange: string;
  mileageRange: string;
  titleType: "clean" | "rebuilt";
  customizations: string[];
  attachments: string[];
};

export type DealPricing = {
  total: number;
  down: number;
  biweekly: number;
  term: Exclude<Term, "cash">;
};

export type DealTimelineEntry = {
  stage: string;
  occurredAt: ISOTimestamp;
};

export type DealRecord = {
  id: string;
  userId: string;
  buildRecordId: string;
  listingId?: string;
  committedSpec: DealCommittedSpec;
  package: PackageTier;
  pricing: DealPricing;
  status: DealStatus;
  timeline: DealTimelineEntry[];
  agreementId: string;
  createdAt: ISOTimestamp;
};

export const makeFixtureDealRecord = (
  overrides: Partial<DealRecord> = {},
): DealRecord => ({
  id: nextFixtureId("deal"),
  userId: "user_fixture",
  buildRecordId: "build_fixture",
  committedSpec: {
    makeModelYearRange: "2018-2020 Honda Accord",
    mileageRange: "40k-70k",
    titleType: "clean",
    customizations: [],
    attachments: [],
  },
  package: "standard",
  pricing: { total: 22000, down: 3500, biweekly: 180, term: "3y" },
  status: "build-started",
  timeline: [{ stage: "build-started", occurredAt: nowIso() }],
  agreementId: "agreement_fixture",
  createdAt: nowIso(),
  ...overrides,
});
