import { beforeEach, describe, expect, test, vi } from "vitest";

type ProfileRow = {
  id: string;
  roles: string[];
  phone: string | null;
  email: string;
  display_name: string | null;
  full_name: string | null;
  zip: string | null;
  budget: number | null;
  credit_score: number | null;
  no_credit: boolean;
  preferences: unknown;
  created_at: string;
  onboarded_at: string | null;
};

const profilesStore: ProfileRow[] = [];

const selectChain = () => {
  const api: {
    order: () => Promise<{ data: ProfileRow[]; error: null }>;
  } = {
    order: async () => ({ data: [...profilesStore], error: null }),
  };
  return api;
};

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table !== "profiles") throw new Error(`unexpected table ${table}`);
      return {
        select: () => selectChain(),
      };
    },
  }),
}));

import { listAllUsers } from "@/lib/admin/users";

const mkRow = (overrides: Partial<ProfileRow> = {}): ProfileRow => ({
  id: "u_" + Math.random().toString(36).slice(2, 6),
  roles: ["buyer"],
  phone: "+15555550100",
  email: `${overrides.id ?? "u"}@example.com`,
  display_name: null,
  full_name: null,
  zip: "43210",
  budget: 20000,
  credit_score: 700,
  no_credit: false,
  preferences: {},
  created_at: new Date().toISOString(),
  onboarded_at: new Date().toISOString(),
  ...overrides,
});

beforeEach(() => {
  profilesStore.length = 0;
});

describe("listAllUsers", () => {
  test("maps every profile into an admin row with derived role", async () => {
    profilesStore.push(
      mkRow({ id: "u_buyer", roles: ["buyer"] }),
      mkRow({ id: "u_dealer", roles: ["dealer"] }),
      mkRow({ id: "u_admin", roles: ["admin", "buyer"] }),
    );
    const rows = await listAllUsers();
    const byId = Object.fromEntries(rows.map((r) => [r.id, r.role]));
    expect(byId).toMatchObject({
      u_buyer: "buyer",
      u_dealer: "dealer",
      u_admin: "admin",
    });
  });

  test("filters by role", async () => {
    profilesStore.push(
      mkRow({ id: "u_1", roles: ["buyer"] }),
      mkRow({ id: "u_2", roles: ["dealer"] }),
    );
    const dealers = await listAllUsers({ role: "dealer" });
    expect(dealers.map((r) => r.id)).toEqual(["u_2"]);
  });

  test("marks pre-onboarding rows as not-onboarded", async () => {
    profilesStore.push(mkRow({ id: "u_new", zip: null }));
    const rows = await listAllUsers();
    expect(rows[0]?.onboarded).toBe(false);
  });
});
