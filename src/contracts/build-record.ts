import { nextFixtureId, nowIso, type ISOTimestamp } from "./common";
import type { TitleStatus } from "./listing-object";

export type PackageTier =
  | "standard"
  | "premium"
  | "silver"
  | "platinum"
  | "gold";

export type BuildCustomizations = {
  wrap?: boolean;
  seats?: boolean;
  starlight?: boolean;
  paint?: boolean;
};

export type BuildAttachment = {
  type: "link" | "file" | "image" | "note";
  ref: string;
  note?: string;
};

export type AlreadyHaveACar = {
  vin?: string;
  fallback?: {
    year: number;
    make: string;
    model: string;
    mileage?: number;
    trim?: string;
  };
  requestedWork: string[];
};

export type TradeIn = {
  vin: string;
  titleStatus: Extract<TitleStatus, "clean" | "rebuilt">;
  estimatedValue?: number;
};

export type BuildRecord = {
  id: string;
  userId: string;
  listingId?: string;
  selectedPackage?: PackageTier;
  customizations: BuildCustomizations;
  attachments: BuildAttachment[];
  alreadyHaveACar?: AlreadyHaveACar;
  tradeIn?: TradeIn;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
};

export const makeFixtureBuildRecord = (
  overrides: Partial<BuildRecord> = {},
): BuildRecord => ({
  id: nextFixtureId("build"),
  userId: "user_fixture",
  customizations: {},
  attachments: [],
  createdAt: nowIso(),
  updatedAt: nowIso(),
  ...overrides,
});
