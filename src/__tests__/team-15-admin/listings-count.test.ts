import { beforeEach, describe, expect, test, vi } from "vitest";

let countToReturn = 0;
let lastSelectOpts: Record<string, unknown> | null = null;

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table !== "listings") {
        throw new Error(`unexpected table ${table}`);
      }
      return {
        select: async (_cols: string, opts: Record<string, unknown>) => {
          lastSelectOpts = opts;
          return { count: countToReturn, error: null };
        },
      };
    },
  }),
}));

import { countListings } from "@/lib/admin/listings";

beforeEach(() => {
  countToReturn = 0;
  lastSelectOpts = null;
});

describe("countListings", () => {
  test("issues a head-only exact count (no row transfer)", async () => {
    countToReturn = 4200;
    await expect(countListings()).resolves.toBe(4200);
    expect(lastSelectOpts).toEqual({ count: "exact", head: true });
  });

  test("returns 0 when Supabase reports null count", async () => {
    countToReturn = 0;
    await expect(countListings()).resolves.toBe(0);
  });
});
