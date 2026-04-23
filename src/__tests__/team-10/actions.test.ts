import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  makeFixtureDealRecord,
  makeFixturePaymentRecord,
  makeFixtureUser,
} from "@/contracts";

// In-memory bucket store so we can observe Team 10's writes to the
// `deal_requests` bucket through Team 15 storage without touching Supabase.
type Bucket = Map<string, unknown>;
const buckets = new Map<string, Bucket>();
const getBucket = (name: string): Bucket => {
  if (!buckets.has(name)) buckets.set(name, new Map());
  return buckets.get(name)!;
};

const hoisted = vi.hoisted(() => ({
  requireUser: vi.fn(),
  getDeal: vi.fn(),
  listDealsForUser: vi.fn(),
  getConversionState: vi.fn(),
  listPaymentsForDeal: vi.fn(),
  listPaymentsForUser: vi.fn(),
  getWireInstructions: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn((_path: string) => {
    throw new Error("__redirect__");
  }),
}));

vi.mock("@/services/team-01-auth", () => ({
  requireUser: (...a: unknown[]) => hoisted.requireUser(...a),
}));

vi.mock("@/services/team-12-workflows", () => ({
  getDeal: (...a: unknown[]) => hoisted.getDeal(...a),
  listDealsForUser: (...a: unknown[]) => hoisted.listDealsForUser(...a),
  getConversionState: (...a: unknown[]) => hoisted.getConversionState(...a),
}));

vi.mock("@/services/team-14-payments", () => ({
  listPaymentsForDeal: (...a: unknown[]) => hoisted.listPaymentsForDeal(...a),
  listPaymentsForUser: (...a: unknown[]) => hoisted.listPaymentsForUser(...a),
  getWireInstructions: (...a: unknown[]) => hoisted.getWireInstructions(...a),
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

vi.mock("next/cache", () => ({
  revalidatePath: (...a: unknown[]) => hoisted.revalidatePath(...a),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => hoisted.redirect(path),
}));

import {
  loadDashboard,
  submitDealRequest,
} from "@/app/dashboard/actions";
import { DEAL_REQUESTS_BUCKET } from "@/lib/deal-requests/storage";

const resetBuckets = () => {
  for (const b of buckets.values()) b.clear();
};

const makeWire = (dealId: string) => ({
  routingNumber: "123456789",
  accountNumber: "000111222",
  beneficiary: "PicknBuild Escrow LLC",
  bankName: "First National",
  reference: dealId,
});

beforeEach(() => {
  resetBuckets();
  hoisted.requireUser.mockReset();
  hoisted.getDeal.mockReset();
  hoisted.listDealsForUser.mockReset();
  hoisted.getConversionState.mockReset();
  hoisted.listPaymentsForDeal.mockReset();
  hoisted.listPaymentsForUser.mockReset();
  hoisted.getWireInstructions.mockReset();
  hoisted.revalidatePath.mockReset();
  hoisted.getWireInstructions.mockImplementation(
    async (input: { dealId: string }) => makeWire(input.dealId),
  );
  hoisted.listPaymentsForDeal.mockResolvedValue([]);
  hoisted.listPaymentsForUser.mockResolvedValue([]);
  hoisted.getConversionState.mockResolvedValue("post-deposit");
});

describe("loadDashboard", () => {
  test("returns the newest deal for the viewer with payments + wire instructions", async () => {
    hoisted.requireUser.mockResolvedValue(
      makeFixtureUser({ id: "u_1", role: "buyer" }),
    );
    const older = makeFixtureDealRecord({
      id: "d_older",
      userId: "u_1",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    const newer = makeFixtureDealRecord({
      id: "d_newer",
      userId: "u_1",
      createdAt: "2026-04-01T00:00:00.000Z",
    });
    hoisted.listDealsForUser.mockResolvedValue([older, newer]);
    const deposit = makeFixturePaymentRecord({
      id: "p_dep",
      userId: "u_1",
      dealId: "d_newer",
      kind: "deposit",
      amount: 1000,
      createdAt: "2026-04-01T00:00:00.000Z",
    });
    hoisted.listPaymentsForDeal.mockImplementation(async (dealId: string) =>
      dealId === "d_newer" ? [deposit] : [],
    );

    const result = await loadDashboard();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.snapshot.deal.id).toBe("d_newer");
      expect(result.snapshot.otherDeals.map((d) => d.id)).toEqual(["d_older"]);
      expect(result.snapshot.payments).toHaveLength(1);
      expect(result.snapshot.wireInstructions.reference).toBe("d_newer");
    }
  });

  test("rejects when the requested deal belongs to another user", async () => {
    hoisted.requireUser.mockResolvedValue(
      makeFixtureUser({ id: "attacker", role: "buyer" }),
    );
    // Attacker has at least one of their own deals so we pass the first guard.
    hoisted.listDealsForUser.mockResolvedValue([
      makeFixtureDealRecord({ id: "d_attacker", userId: "attacker" }),
    ]);
    // The victim's deal exists in the store but is owned by someone else.
    hoisted.getDeal.mockImplementation(async (id: string) =>
      id === "d_victim"
        ? makeFixtureDealRecord({ id: "d_victim", userId: "u_victim" })
        : null,
    );

    const result = await loadDashboard({ dealId: "d_victim" });
    expect(result).toEqual({ ok: false, reason: "forbidden" });
    // No wire instructions leaked out.
    expect(hoisted.getWireInstructions).not.toHaveBeenCalled();
  });

  test("returns no-deals when the viewer has no deals yet (post-deposit race)", async () => {
    hoisted.requireUser.mockResolvedValue(
      makeFixtureUser({ id: "u_1", role: "buyer" }),
    );
    hoisted.listDealsForUser.mockResolvedValue([]);
    const result = await loadDashboard();
    expect(result).toEqual({ ok: false, reason: "no-deals" });
  });

  test("merges user-level deposit rows that don't yet carry a dealId", async () => {
    hoisted.requireUser.mockResolvedValue(
      makeFixtureUser({ id: "u_1", role: "buyer" }),
    );
    const deal = makeFixtureDealRecord({ id: "d_1", userId: "u_1" });
    hoisted.listDealsForUser.mockResolvedValue([deal]);
    // The webhook hasn't stamped dealId onto the deposit yet.
    const deposit = makeFixturePaymentRecord({
      id: "p_dep",
      userId: "u_1",
      kind: "deposit",
      dealId: undefined,
      amount: 1000,
    });
    hoisted.listPaymentsForDeal.mockResolvedValue([]);
    hoisted.listPaymentsForUser.mockResolvedValue([deposit]);

    const result = await loadDashboard();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.snapshot.payments.map((p) => p.id)).toEqual(["p_dep"]);
    }
  });
});

describe("submitDealRequest", () => {
  test("writes a submitted row to bucket 'deal_requests' owned by the viewer", async () => {
    hoisted.requireUser.mockResolvedValue(
      makeFixtureUser({ id: "u_1", role: "buyer" }),
    );
    hoisted.getDeal.mockResolvedValue(
      makeFixtureDealRecord({ id: "d_1", userId: "u_1" }),
    );

    const result = await submitDealRequest({
      dealId: "d_1",
      kind: "upgrade",
      reason: "want the premium package",
    });

    expect(result.ok).toBe(true);
    expect(DEAL_REQUESTS_BUCKET).toBe("deal_requests");
    const rows = Array.from(getBucket("deal_requests").values()) as Array<{
      userId: string;
      dealId: string;
      kind: string;
      reason: string;
      status: string;
    }>;
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      userId: "u_1",
      dealId: "d_1",
      kind: "upgrade",
      reason: "want the premium package",
      status: "submitted",
    });
    expect(hoisted.revalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  test("rejects when the viewer does not own the deal", async () => {
    hoisted.requireUser.mockResolvedValue(
      makeFixtureUser({ id: "attacker", role: "buyer" }),
    );
    hoisted.getDeal.mockResolvedValue(
      makeFixtureDealRecord({ id: "d_victim", userId: "u_victim" }),
    );

    const result = await submitDealRequest({
      dealId: "d_victim",
      kind: "surrender",
      reason: "no reason just wrecking it",
    });

    expect(result.ok).toBe(false);
    expect(getBucket("deal_requests").size).toBe(0);
  });

  test("rejects when the reason is empty / too short", async () => {
    hoisted.requireUser.mockResolvedValue(
      makeFixtureUser({ id: "u_1", role: "buyer" }),
    );
    const result = await submitDealRequest({
      dealId: "d_1",
      kind: "downgrade",
      reason: "  ",
    });
    expect(result.ok).toBe(false);
    // getDeal should not have been called — we short-circuit on validation.
    expect(hoisted.getDeal).not.toHaveBeenCalled();
  });
});
