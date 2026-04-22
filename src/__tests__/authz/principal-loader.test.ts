import { beforeEach, describe, expect, test, vi } from "vitest";

// Chainable builder that supabase-js returns from .from(...).select(...).eq(...).maybeSingle()
const maybeSingleResult = { data: null as unknown, error: null as unknown };
const eqMock = vi.fn(() => ({
  maybeSingle: vi.fn(async () => maybeSingleResult),
}));
const selectMock = vi.fn(() => ({ eq: eqMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));
const getUserMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: getUserMock },
    from: fromMock,
  }),
}));

import { loadPrincipal } from "@/lib/authz/server/principal-loader";

function setMe(user: unknown) {
  getUserMock.mockResolvedValue({ data: { user }, error: null });
}
function setProfile(profile: unknown) {
  maybeSingleResult.data = profile;
  maybeSingleResult.error = null;
}

beforeEach(() => {
  getUserMock.mockReset();
  fromMock.mockClear();
  selectMock.mockClear();
  eqMock.mockClear();
  maybeSingleResult.data = null;
  maybeSingleResult.error = null;
});

describe("loadPrincipal", () => {
  test("returns null when no user session", async () => {
    setMe(null);
    const p = await loadPrincipal();
    expect(p).toBeNull();
    expect(fromMock).not.toHaveBeenCalled();
  });

  test("returns null when user exists but profile row is missing", async () => {
    setMe({ id: "u1", email_confirmed_at: "2026-01-01T00:00:00Z" });
    setProfile(null);
    const p = await loadPrincipal();
    expect(p).toBeNull();
  });

  test("builds Principal with verified email and phone", async () => {
    setMe({ id: "u1", email_confirmed_at: "2026-01-01T00:00:00Z" });
    setProfile({
      id: "u1",
      roles: ["buyer"],
      account_status: "active",
      phone_verified_at: "2026-01-02T00:00:00Z",
      dealer_pages: null,
    });

    const p = await loadPrincipal();
    expect(p).toEqual({
      id: "u1",
      roles: ["buyer"],
      email_verified: true,
      phone_verified: true,
      account_status: "active",
      dealer: undefined,
    });
  });

  test("email_verified=false when email_confirmed_at is null", async () => {
    setMe({ id: "u1", email_confirmed_at: null });
    setProfile({
      id: "u1",
      roles: ["buyer"],
      account_status: "active",
      phone_verified_at: null,
      dealer_pages: null,
    });
    const p = await loadPrincipal();
    expect(p?.email_verified).toBe(false);
    expect(p?.phone_verified).toBe(false);
  });

  test("filters out unknown roles and falls back to buyer when empty", async () => {
    setMe({ id: "u1", email_confirmed_at: "x" });
    setProfile({
      id: "u1",
      roles: ["ghost", "wizard"],
      account_status: "active",
      phone_verified_at: null,
      dealer_pages: null,
    });
    const p = await loadPrincipal();
    expect(p?.roles).toEqual(["buyer"]);
  });

  test("preserves multi-role array", async () => {
    setMe({ id: "u1", email_confirmed_at: "x" });
    setProfile({
      id: "u1",
      roles: ["buyer", "admin"],
      account_status: "active",
      phone_verified_at: null,
      dealer_pages: null,
    });
    const p = await loadPrincipal();
    expect(p?.roles).toEqual(["buyer", "admin"]);
  });

  test("coerces unknown account_status to active", async () => {
    setMe({ id: "u1", email_confirmed_at: "x" });
    setProfile({
      id: "u1",
      roles: ["buyer"],
      account_status: "garbage",
      phone_verified_at: null,
      dealer_pages: null,
    });
    const p = await loadPrincipal();
    expect(p?.account_status).toBe("active");
  });

  test("passes through known account_status values", async () => {
    setMe({ id: "u1", email_confirmed_at: "x" });
    setProfile({
      id: "u1",
      roles: ["buyer"],
      account_status: "suspended",
      phone_verified_at: null,
      dealer_pages: null,
    });
    const p = await loadPrincipal();
    expect(p?.account_status).toBe("suspended");
  });

  test("extracts dealer from dealer_pages returned as array", async () => {
    setMe({ id: "u1", email_confirmed_at: "x" });
    setProfile({
      id: "u1",
      roles: ["dealer"],
      account_status: "active",
      phone_verified_at: "y",
      dealer_pages: [
        { id: "dp-1", claimed: true, subscription_active: false },
      ],
    });
    const p = await loadPrincipal();
    expect(p?.dealer).toEqual({
      page_id: "dp-1",
      page_claimed: true,
      subscription_active: false,
    });
  });

  test("extracts dealer from dealer_pages returned as a single object", async () => {
    setMe({ id: "u1", email_confirmed_at: "x" });
    setProfile({
      id: "u1",
      roles: ["dealer"],
      account_status: "active",
      phone_verified_at: "y",
      dealer_pages: {
        id: "dp-2",
        claimed: false,
        subscription_active: false,
      },
    });
    const p = await loadPrincipal();
    expect(p?.dealer).toEqual({
      page_id: "dp-2",
      page_claimed: false,
      subscription_active: false,
    });
  });

  test("dealer undefined when the profile has no dealer_pages row", async () => {
    setMe({ id: "u1", email_confirmed_at: "x" });
    setProfile({
      id: "u1",
      roles: ["dealer"],
      account_status: "active",
      phone_verified_at: null,
      dealer_pages: [],
    });
    const p = await loadPrincipal();
    expect(p?.dealer).toBeUndefined();
  });
});
