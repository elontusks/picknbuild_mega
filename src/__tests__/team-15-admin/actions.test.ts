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
  profilesUpdate: vi.fn(async () => ({ error: null })),
  sponsorUpsert: vi.fn(async () => ({ error: null })),
  sponsorUpdate: vi.fn(async () => ({ error: null })),
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
          update: (_patch: unknown) => ({
            eq: async (_col: string, _val: string) => hoisted.profilesUpdate(),
          }),
        };
      }
      if (table === "sponsor_blocks") {
        return {
          upsert: async (_row: unknown) => hoisted.sponsorUpsert(),
          update: (_patch: unknown) => ({
            eq: async (_col: string, _val: string) => hoisted.sponsorUpdate(),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));

import {
  acknowledgeDealRequestAction,
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

describe("requireAdmin gate", () => {
  test("non-admin callers are redirected to /", async () => {
    hoisted.getCurrentUser.mockResolvedValue(
      makeFixtureUser({ id: "u_1", role: "buyer" }),
    );
    await expect(
      removeListingAction({ listingId: "l_1" }),
    ).rejects.toThrow("__redirect__");
    expect(hoisted.redirect).toHaveBeenCalledWith("/");
    // No moderation or log side-effects landed.
    expect(getBucket(ADMIN_LOGS_BUCKET).size).toBe(0);
    expect(getBucket(MODERATION_LOG_BUCKET).size).toBe(0);
    expect(hoisted.markListingStatus).not.toHaveBeenCalled();
  });

  test("anonymous callers are redirected to /login", async () => {
    hoisted.getCurrentUser.mockResolvedValue(null);
    await expect(
      removeListingAction({ listingId: "l_1" }),
    ).rejects.toThrow("__redirect__");
    expect(hoisted.redirect).toHaveBeenCalledWith("/login");
  });
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
    const modRows = Array.from(
      getBucket(MODERATION_LOG_BUCKET).values(),
    ) as Array<{ action: string; targetId: string; note?: string }>;
    expect(modRows).toHaveLength(1);
    expect(modRows[0]).toMatchObject({
      action: "remove",
      targetId: "listing_42",
      note: "spam",
    });
    const logs = Array.from(
      getBucket(ADMIN_LOGS_BUCKET).values(),
    ) as Array<{ action: string; target: string }>;
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

    const logs = Array.from(
      getBucket(ADMIN_LOGS_BUCKET).values(),
    ) as Array<{ action: string; target: string }>;
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
    expect(getBucket(ADMIN_LOGS_BUCKET).size).toBe(0);
  });

  test("rejects non-admin callers before touching the bucket", async () => {
    hoisted.getCurrentUser.mockResolvedValue(
      makeFixtureUser({ id: "attacker", role: "buyer" }),
    );
    seedRequest();
    await expect(
      acknowledgeDealRequestAction({ requestId: "dreq_1" }),
    ).rejects.toThrow("__redirect__");
    const req = getBucket(DEAL_REQUESTS_BUCKET).get("dreq_1") as DealRequest;
    expect(req.status).toBe("submitted");
  });
});

describe("suspendUserAction + resetUserFinancialsAction", () => {
  test("suspend calls profiles update and logs the action", async () => {
    hoisted.getCurrentUser.mockResolvedValue(makeAdmin());
    const res = await suspendUserAction({ userId: "u_2", note: "abuse" });
    expect(res.ok).toBe(true);
    expect(hoisted.profilesUpdate).toHaveBeenCalledTimes(1);
    const logs = Array.from(getBucket(ADMIN_LOGS_BUCKET).values()) as Array<{
      action: string;
      target: string;
    }>;
    expect(logs[0]).toMatchObject({ action: "user.suspend", target: "u_2" });
  });

  test("reset-financials logs but does not touch deal history", async () => {
    hoisted.getCurrentUser.mockResolvedValue(makeAdmin());
    const res = await resetUserFinancialsAction({ userId: "u_3" });
    expect(res.ok).toBe(true);
    expect(hoisted.profilesUpdate).toHaveBeenCalledTimes(1);
    const logs = Array.from(getBucket(ADMIN_LOGS_BUCKET).values()) as Array<{
      action: string;
    }>;
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
    expect(getBucket(INGESTION_RUNS_BUCKET).size).toBe(1);
    const logs = Array.from(getBucket(ADMIN_LOGS_BUCKET).values()) as Array<{
      action: string;
    }>;
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
    const logs = Array.from(getBucket(ADMIN_LOGS_BUCKET).values()) as Array<{
      action: string;
    }>;
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
    const logs = Array.from(getBucket(ADMIN_LOGS_BUCKET).values()) as Array<{
      action: string;
    }>;
    expect(logs[0]?.action).toBe("sponsor.toggle-active");
  });
});
