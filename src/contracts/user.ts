import { nextFixtureId, nowIso, type ISOTimestamp } from "./common";

export type UserRole = "buyer" | "dealer" | "seller" | "admin";

export type BestFitPreference = "lowestTotal" | "lowestMonthly";

export type UserPreferences = {
  bestFit: BestFitPreference;
  notifChannels: string[];
};

export type User = {
  id: string;
  role: UserRole;
  phone: string;
  email?: string;
  displayName?: string;
  zip: string;
  budget?: number;
  creditScore?: number;
  noCredit?: boolean;
  preferences: UserPreferences;
  createdAt: ISOTimestamp;
};

export const makeFixtureUser = (overrides: Partial<User> = {}): User => ({
  id: nextFixtureId("user"),
  role: "buyer",
  phone: "+15555550100",
  email: "buyer@example.com",
  displayName: "Jane Buyer",
  zip: "43210",
  budget: 25000,
  creditScore: 680,
  noCredit: false,
  preferences: { bestFit: "lowestTotal", notifChannels: ["in-app", "email"] },
  createdAt: nowIso(),
  ...overrides,
});
