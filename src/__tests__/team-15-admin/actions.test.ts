import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  makeFixtureUser,
  nowIso,
  type User,
} from "@/contracts";
import type { DealRequest } from "@/lib/deal-requests/types";

type Bucket = Map<string, unknown>;
const buckets = new Map<string, Bucket>();
const getBucket = (name: string): Bucket => {
  if (!buckets.has(name)) buckets.set(name, new Map());
  return buckets.get(name)!;
};

const hoisted = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  redirect: vi.fn((_path: string) => {
    throw new Error("__redirect__");
  }),
  revalidatePath: vi.fn(),
  markListingStatus: vi.fn<(id: string, status: string) => Promise<void>>(
    async () => {},
  ),
  profilesUpdate: vi.fn<(patch: unknown) => Promise<{ error: null }>>(
    async () => ({ error: null }),
  ),
  sponsorUpsert: vi.fn<(row: unknown) => Promise<{ error: null }>>(
    async () => ({ error: null }),
  ),
  sponsorUpdate: vi.fn<(patch: unknown) => Promise<{ error: null }>>(
    async () => ({ error: null }),
  ),
}));

vi.mock("@/services/team-01-auth", () => ({
  getCurrentUser: (...a: unknown[]) => hoisted.getCurrentUser(...a),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => hoisted.redirect(path),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...a: unknown[]) => hoisted.revalidatePath(...a),
}));

vi.mock("@/services/team-15-storage", () => ({
  putRecord: vi.fn(async (bucket: string, id: string, value: unknown) => {
    getBucket(bucket).set(id, value);
  }),
  getRecord: vi.fn(async (bucket: string, id: string) =>
    getBucket(bucket).get(id) ?? null,
  ),
  listRecords: vi.fn(async (bucket: string) =>
    Array.from(getBucket(bucket).values()),
  ),
  removeRecord: vi.fn(async (bucket: string, id: string) => {
    getBucket(bucket).delete(id);
  }),
  // Simulated CAS: compare the current jsonb against `expected`; if deep
  // equal, swap to `next` and return true. Otherwise return false. This
  // mirrors the Postgres `value = jsonb` comparison semantics closely
  // enough for unit coverage — the real atomicity story is the
  // secure_records_compare_and_set RPC tested separately.
  compareAndSetRecord: vi.fn(
    async (bucket: string, id: string, expected: unknown, next: unknown) => {
      const cur = getBucket(bucket).get(id);
      if (JSON.stringify(cur) !== JSON.stringify(expected)) return false;
      getBucket(bucket).set(id, next);
      return true;
    },
  ),
}));

vi.mock("@/services/team-03-supply", () => ({
  markListingStatus: (id: string, status: string) =>
    hoisted.markListingStatus(id, status),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === "profiles") {
        return {
          update: (patch: unknown) => ({
            eq: async (_col: string, _val: string) =>
              hoisted.profilesUpdate(patch),
          }),
        };
      }
      if (table === "sponsor_blocks") {
        return {
          upsert: async (row: unknown) => hoisted.sponsorUpsert(row),
          update: (patch: unknown) => ({
            eq: async (_col: string, _val: string) =>
              hoisted.sponsorUpdate(patch),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));

import {
  acknowledgeDealRequestAction,
  markListingStaleAction,
  recordIngestionHeartbeatAction,
  removeListingAction,
  resetUserFinancialsAction,
  suspendUserAction,
  toggleSponsorActiveAction,
  upsertSponsorAction,
} from "@/app/admin/actions";
import { ADMIN_LOGS_BUCKET } from "@/services/team-15-logging";
import { DEAL_REQUESTS_BUCKET } from "@/lib/deal-requests/storage";
import { MODERATION_LOG_BUCKET } from "@/lib/admin/moderation";
import { INGESTION_RUNS_BUCKET } from "@/lib/admin/ingestion";

const makeAdmin = (): User => makeFixtureUser({ id: "admin_1", role: "admin" });

const seedRequest = (
  override: Partial<DealRequest> = {},
): DealRequest => {
  const req: DealRequest = {
    id: "dreq_1",
    userId: "u_buyer",
    dealId: "deal_1",
    kind: "upgrade",
    reason: "want more",
    status: "submitted",
    createdAt: nowIso(),
    ...override,
  };
  getBucket(DEAL_REQUESTS_BUCKET).set(req.id, req);
  return req;
};

const allLogs = () => Array.from(getBucket(ADMIN_LOGS_BUCKET).values());
const allModLogs = () => Array.from(getBucket(MODERATION_LOG_BUCKET).values());
const allIngestionRuns = () => Array.from(getBucket(INGESTION_RUNS_BUCKET).values());

const expectNoMutations = () => {
  // Aggregate: no admin log, no moderation log, no ingestion row, no DB
  // writes. Every admin-gate test should leave the system identical to
  // its pre-call state except for the existing seeded rows.
  expect(allLogs()).toHaveLength(0);
  expect(allModLogs()).toHaveLength(0);
  expect(allIngestionRuns()).toHaveLength(0);
  expect(hoisted.markListingStatus).not.toHaveBeenCalled();
  expect(hoisted.profilesUpdate).not.toHaveBeenCalled();
  expect(hoisted.sponsorUpsert).not.toHaveBeenCalled();
  expect(hoisted.sponsorUpdate).not.toHaveBeenCalled();
};

beforeEach(() => {
  for (const b of buckets.values()) b.clear();
  hoisted.getCurrentUser.mockReset();
  hoisted.redirect.mockClear();
  hoisted.revalidatePath.mockClear();
  hoisted.markListingStatus.mockClear();
  hoisted.profilesUpdate.mockReset().mockResolvedValue({ error: null });
  hoisted.sponsorUpsert.mockReset().mockResolvedValue({ error: null });
  hoisted.sponsorUpdate.mockReset().mockResolvedValue({ error: null });
});

describe("requireAdmin gate (redirect shape)", () => {
  test("non-admin callers are redirected to /", async () => {
    hoisted.getCurrentUser.mockResolvedValue(
      makeFixtureUser({ id: "u_1", role: "buyer" }),
    );
    await expect(
      removeListingAction({ listingId: "l_1" }),
    ).rejects.toThrow("__redirect__");
    expect(hoisted.redirect).toHaveBeenCalledWith("/");
    expectNoMutations();
  });

  test("anonymous callers are redirected to /login", async () => {
    hoisted.getCurrentUser.mockResolvedValue(null);
    await expect(
      removeListingAction({ listingId: "l_1" }),
    ).rejects.toThrow("__redirect__");
    expect(hoisted.redirect).toHaveBeenCalledWith("/login");
    expectNoMutations();
  });
});

// Per-action gate tests. Every server action must refuse a non-admin viewer
// before any mutation OR log write lands. If the gate is ever deleted, these
// tests are the sanity net — adding a one-liner `await requireAdmin()` has
// to be the first real statement in each handler.
describe("admin gate blocks non-admin callers for every action", () => {
  const cases: Array<{
    name: string;
    run: () => Promise<unknown>;
    setup?: () => void;
  }> = [
    {
      name: "removeListingAction",
      run: () => removeListingAction({ listingId: "l_1" }),
    },
    {
      name: "markListingStaleAction",
      run: () => markListingStaleAction({ listingId: "l_1" }),
    },
    {
      name: "acknowledgeDealRequestAction",
      setup: () => {
        seedRequest();
      },
      run: () => acknowledgeDealRequestAction({ requestId: "dreq_1" }),
    },
    {
      name: "suspendUserAction",
      run: () => suspendUserAction({ userId: "u_2" }),
    },
    {
      name: "resetUserFinancialsAction",
      run: () => resetUserFinancialsAction({ userId: "u_2" }),
    },
    {
      name: "recordIngestionHeartbeatAction",
      run: () =>
        recordIngestionHeartbeatAction({ source: "copart", status: "ok" }),
    },
    {
      name: "upsertSponsorAction",
      run: () =>
        upsertSponsorAction({
          path: "picknbuild",
          title: "Tier 1",
          bodyHtml: "",
        }),
    },
    {
      name: "toggleSponsorActiveAction",
      run: () => toggleSponsorActiveAction({ id: "sponsor_1", active: false }),
    },
  ];

  for (const c of cases) {
    test(`${c.name} refuses a non-admin viewer`, async () => {
      hoisted.getCurrentUser.mockResolvedValue(
        makeFixtureUser({ id: "attacker", role: "buyer" }),
      );
      c.setup?.();
      // Snapshot the seeded deal_request so we can assert no mutation
      // happened to it either.
      const seededReq =
        (getBucket(DEAL_REQUESTS_BUCKET).get("dreq_1") as DealRequest | undefined) ??
        null;

      await expect(c.run()).rejects.toThrow("__redirect__");
      expect(hoisted.redirect).toHaveBeenCalledWith("/");
      expectNoMutations();

      if (seededReq) {
        const afterReq = getBucket(DEAL_REQUESTS_BUCKET).get("dreq_1") as DealRequest;
        expect(afterReq.status).toBe(seededReq.status);
      }
    });
  }
});

describe("removeListingAction", () => {
  test("flips listing status to removed, records audit + log entries", async () => {
    hoisted.getCurrentUser.mockResolvedValue(makeAdmin());
    const res = await removeListingAction({
      listingId: "listing_42",
      note: "spam",
    });
    expect(res.ok).toBe(true);
    expect(hoisted.markListingStatus).toHaveBeenCalledWith(
      "listing_42",
      "removed",
    );
    const modRows = allModLogs() as Array<{
      action: string;
      targetId: string;
      note?: string;
    }>;
    expect(modRows).toHaveLength(1);
    expect(modRows[0]).toMatchObject({
      action: "remove",
      targetId: "listing_42",
      note: "spam",
    });
    const logs = allLogs() as Array<{ action: string; target: string }>;
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      action: "listing.remove",
      target: "listing_42",
    });
  });
});

describe("acknowledgeDealRequestAction", () => {
  test("flips a submitted request to acknowledged and writes a log row", async () => {
    hoisted.getCurrentUser.mockResolvedValue(makeAdmin());
    const req = seedRequest();

    const res = await acknowledgeDealRequestAction({ requestId: req.id });
    expect(res.ok).toBe(true);

    const updated = getBucket(DEAL_REQUESTS_BUCKET).get(req.id) as DealRequest;
    expect(updated.status).toBe("acknowledged");

    const logs = allLogs() as Array<{ action: string; target: string }>;
    expect(logs[0]).toMatchObject({
      action: "deal_request.acknowledge",
      target: req.id,
    });
  });

  test("refuses when the request is not in submitted status", async () => {
    hoisted.getCurrentUser.mockResolvedValue(makeAdmin());
    seedRequest({ status: "acknowledged" });
    const res = await acknowledgeDealRequestAction({ requestId: "dreq_1" });
    expect(res.ok).toBe(false);
    // Log not written on refusal.
    expect(allLogs()).toHaveLength(0);
  });

  test("second admin loses the CAS when another acknowledge landed first", async () => {
    hoisted.getCurrentUser.mockResolvedValue(makeAdmin());
    const req = seedRequest();

    // Simulate a concurrent admin flipping the row between the first
    // admin's `getDealRequest` and the CAS write. We patch getRecord so
    // the first call returns the original submitted row (what the first
    // admin "read"), then another write happens in the bucket (the race
    // winner), and finally the CAS runs against the mutated row.
    const storage = await import("@/services/team-15-storage");
    const getSpy = vi
      .spyOn(storage, "getRecord")
      .mockImplementationOnce(async () => ({ ...req }));

    // Race winner: a different admin already flipped it.
    getBucket(DEAL_REQUESTS_BUCKET).set(req.id, {
      ...req,
      status: "acknowledged",
    });

    const res = await acknowledgeDealRequestAction({ requestId: req.id });
    expect(res.ok).toBe(false);
    // No second log row from the losing admin.
    expect(allLogs()).toHaveLength(0);
    getSpy.mockRestore();
  });
});

describe("suspendUserAction + resetUserFinancialsAction", () => {
  test("suspend patches profiles with account_status='suspended' and logs", async () => {
    hoisted.getCurrentUser.mockResolvedValue(makeAdmin());
    const res = await suspendUserAction({ userId: "u_2", note: "abuse" });
    expect(res.ok).toBe(true);
    expect(hoisted.profilesUpdate).toHaveBeenCalledTimes(1);
    // This is the column that the `20260422000420_add_roles_to_profiles`
    // migration constrained to ('active', 'suspended', 'banned',
    // 'unverified') — if the action ever drifts off that column name or
    // value, the database CHECK would reject the write and we'd fail
    // silently at runtime. The assertion anchors the mapping.
    expect(hoisted.profilesUpdate).toHaveBeenCalledWith({
      account_status: "suspended",
    });
    const logs = allLogs() as Array<{
      action: string;
      target: string;
    }>;
    expect(logs[0]).toMatchObject({ action: "user.suspend", target: "u_2" });
  });

  test("reset-financials patches the three financial fields (no deal-history touch)", async () => {
    hoisted.getCurrentUser.mockResolvedValue(makeAdmin());
    const res = await resetUserFinancialsAction({ userId: "u_3" });
    expect(res.ok).toBe(true);
    expect(hoisted.profilesUpdate).toHaveBeenCalledTimes(1);
    expect(hoisted.profilesUpdate).toHaveBeenCalledWith({
      budget: null,
      credit_score: null,
      no_credit: false,
    });
    const logs = allLogs() as Array<{ action: string }>;
    expect(logs[0]?.action).toBe("user.reset-financials");
  });
});

describe("ingestion heartbeat", () => {
  test("writes an ingestion_runs row + admin log", async () => {
    hoisted.getCurrentUser.mockResolvedValue(makeAdmin());
    const res = await recordIngestionHeartbeatAction({
      source: "copart",
      status: "ok",
      ingested: 142,
    });
    expect(res.ok).toBe(true);
    expect(allIngestionRuns()).toHaveLength(1);
    const logs = allLogs() as Array<{ action: string }>;
    expect(logs[0]?.action).toBe("ingestion.heartbeat");
  });
});

describe("sponsor catalog", () => {
  test("upsertSponsorAction rejects empty title", async () => {
    hoisted.getCurrentUser.mockResolvedValue(makeAdmin());
    const res = await upsertSponsorAction({
      path: "picknbuild",
      title: "   ",
      bodyHtml: "",
    });
    expect(res.ok).toBe(false);
    expect(hoisted.sponsorUpsert).not.toHaveBeenCalled();
  });

  test("upsertSponsorAction persists + logs on success", async () => {
    hoisted.getCurrentUser.mockResolvedValue(makeAdmin());
    const res = await upsertSponsorAction({
      path: "picknbuild",
      title: "Tier 1",
      bodyHtml: "<p>hi</p>",
    });
    expect(res.ok).toBe(true);
    expect(hoisted.sponsorUpsert).toHaveBeenCalledTimes(1);
    const logs = allLogs() as Array<{ action: string }>;
    expect(logs[0]?.action).toBe("sponsor.create");
  });

  test("toggleSponsorActive flips flag and logs", async () => {
    hoisted.getCurrentUser.mockResolvedValue(makeAdmin());
    const res = await toggleSponsorActiveAction({
      id: "sponsor_1",
      active: false,
    });
    expect(res.ok).toBe(true);
    expect(hoisted.sponsorUpdate).toHaveBeenCalledTimes(1);
    expect(hoisted.sponsorUpdate).toHaveBeenCalledWith({ active: false });
    const logs = allLogs() as Array<{ action: string }>;
    expect(logs[0]?.action).toBe("sponsor.toggle-active");
  });
});
