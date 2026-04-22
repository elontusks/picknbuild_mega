import { describe, expect, test } from "vitest";
import { deriveRole, mapProfileToUser, type ProfileForUser } from "@/lib/auth/map-user";

const baseProfile: ProfileForUser = {
  id: "u-1",
  roles: ["buyer"],
  phone: "+15555550100",
  email: "j@example.com",
  display_name: "Jane",
  full_name: null,
  zip: "43210",
  budget: 5000,
  credit_score: 700,
  no_credit: false,
  preferences: { bestFit: "lowestTotal", notifChannels: ["in-app", "email"] },
  created_at: "2026-04-21T00:00:00.000Z",
  onboarded_at: "2026-04-21T01:00:00.000Z",
};

describe("deriveRole", () => {
  test("admin wins over everything", () => {
    expect(deriveRole(["buyer", "dealer", "admin"])).toBe("admin");
  });
  test("dealer wins over buyer/seller", () => {
    expect(deriveRole(["buyer", "dealer", "individual_seller"])).toBe("dealer");
  });
  test("individual_seller maps to contract 'seller'", () => {
    expect(deriveRole(["individual_seller"])).toBe("seller");
  });
  test("plain 'seller' is also accepted", () => {
    expect(deriveRole(["seller"])).toBe("seller");
  });
  test("falls back to buyer when empty", () => {
    expect(deriveRole([])).toBe("buyer");
    expect(deriveRole(null)).toBe("buyer");
    expect(deriveRole(undefined)).toBe("buyer");
  });
});

describe("mapProfileToUser", () => {
  test("returns a complete User contract from a fully onboarded profile", () => {
    const user = mapProfileToUser(baseProfile, { id: "u-1", phone: "+15555550100" });
    expect(user).toEqual({
      id: "u-1",
      role: "buyer",
      phone: "+15555550100",
      zip: "43210",
      preferences: { bestFit: "lowestTotal", notifChannels: ["in-app", "email"] },
      createdAt: "2026-04-21T00:00:00.000Z",
      email: "j@example.com",
      displayName: "Jane",
      budget: 5000,
      creditScore: 700,
    });
  });

  test("returns null when zip is missing (not yet onboarded)", () => {
    const profile = { ...baseProfile, zip: null };
    expect(mapProfileToUser(profile, { id: "u-1", phone: "+15555550100" })).toBeNull();
  });

  test("returns null when no phone available from either profile or auth", () => {
    const profile = { ...baseProfile, phone: null };
    expect(mapProfileToUser(profile, { id: "u-1" })).toBeNull();
  });

  test("falls back to auth phone when profile.phone is missing", () => {
    const profile = { ...baseProfile, phone: null };
    const user = mapProfileToUser(profile, { id: "u-1", phone: "+15555550101" });
    expect(user?.phone).toBe("+15555550101");
  });

  test("derives displayName from full_name when display_name absent", () => {
    const profile = { ...baseProfile, display_name: null, full_name: "Janet F." };
    const user = mapProfileToUser(profile, { id: "u-1" });
    expect(user?.displayName).toBe("Janet F.");
  });

  test("noCredit only present when true", () => {
    const profile = { ...baseProfile, no_credit: false, credit_score: null };
    const user = mapProfileToUser(profile, { id: "u-1" });
    expect(user?.noCredit).toBeUndefined();
    expect(user?.creditScore).toBeUndefined();
  });

  test("preferences fallback when stored value malformed", () => {
    const profile: ProfileForUser = { ...baseProfile, preferences: "garbage" };
    const user = mapProfileToUser(profile, { id: "u-1" });
    expect(user?.preferences).toEqual({
      bestFit: "lowestTotal",
      notifChannels: ["in-app"],
    });
  });

  test("preferences validates bestFit enum", () => {
    const profile = {
      ...baseProfile,
      preferences: { bestFit: "lowestTotal", notifChannels: ["digest"] },
    };
    const user = mapProfileToUser(profile, { id: "u-1" });
    expect(user?.preferences.bestFit).toBe("lowestTotal");
    expect(user?.preferences.notifChannels).toEqual(["digest"]);

    const bad: ProfileForUser = {
      ...baseProfile,
      preferences: { bestFit: "lowestEverything", notifChannels: 5 },
    };
    const user2 = mapProfileToUser(bad, { id: "u-1" });
    expect(user2?.preferences.bestFit).toBe("lowestTotal");
    expect(user2?.preferences.notifChannels).toEqual(["in-app"]);
  });
});
