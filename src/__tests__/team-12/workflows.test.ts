import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  makeFixtureAgreementDocument,
  makeFixtureBuildRecord,
  type ConversionState,
  type DealRecord,
  type DealStatus,
} from "@/contracts";

// In-memory store keyed by `${bucket}:${id}` that stands in for team-15-storage.
// Hoisted so the vi.mock factories (which are themselves hoisted) can see it.
const { store, putRecord, getRecord, listRecords, removeRecord, emitNotification } =
  vi.hoisted(() => {
    const store = new Map<string, unknown>();
    return {
      store,
      putRecord: vi.fn(async (bucket: string, id: string, value: unknown) => {
        store.set(`${bucket}:${id}`, value);
      }),
      getRecord: vi.fn(async (bucket: string, id: string) => {
        return store.get(`${bucket}:${id}`) ?? null;
      }),
      listRecords: vi.fn(async (bucket: string) => {
        const prefix = `${bucket}:`;
        return Array.from(store.entries())
          .filter(([k]) => k.startsWith(prefix))
          .map(([, v]) => v);
      }),
      removeRecord: vi.fn(async (bucket: string, id: string) => {
        store.delete(`${bucket}:${id}`);
      }),
      emitNotification: vi.fn(async () => []),
    };
  });

vi.mock("@/services/team-15-storage", () => ({
  putRecord,
  getRecord,
  listRecords,
  removeRecord,
}));

vi.mock("@/services/team-13-notifications", () => ({
  emitNotification,
}));

import * as Workflows from "@/services/team-12-workflows";

beforeEach(() => {
  store.clear();
  putRecord.mockClear();
  getRecord.mockClear();
  listRecords.mockClear();
  removeRecord.mockClear();
  emitNotification.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("conversion state machine", () => {
  const ctx = { userId: "u1", listingId: "L1", path: "picknbuild" as const };

  test("getConversionState defaults to 'decided' when no record exists", async () => {
    await expect(
      Workflows.getConversionState({ userId: "u1", listingId: "L1" }),
    ).resolves.toBe<ConversionState>("decided");
  });

  test("recordDecision persists a new decided-state record", async () => {
    const record = await Workflows.recordDecision(ctx);
    expect(record.state).toBe("decided");
    expect(record.path).toBe("picknbuild");
    expect(record.history).toEqual([
      { state: "decided", occurredAt: expect.any(String) },
    ]);
    expect(putRecord).toHaveBeenCalledWith(
      "conversion_states",
      "u1:L1",
      expect.objectContaining({ state: "decided" }),
    );
  });

  test("recordDecision is idempotent", async () => {
    const first = await Workflows.recordDecision(ctx);
    const second = await Workflows.recordDecision(ctx);
    expect(second).toEqual(first);
    expect(putRecord).toHaveBeenCalledTimes(1);
  });

  test("transitionConversionState advances decided → payment-initiated and persists history", async () => {
    await Workflows.recordDecision(ctx);
    const result = await Workflows.transitionConversionState({
      ctx,
      from: "decided",
      to: "payment-initiated",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state).toBe("payment-initiated");
    expect(result.record.history.map((h) => h.state)).toEqual([
      "decided",
      "payment-initiated",
    ]);
  });

  test("transitionConversionState rejects illegal jumps", async () => {
    const result = await Workflows.transitionConversionState({
      ctx,
      from: "decided",
      to: "deposit-received",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("illegal-transition");
  });

  test("transitionConversionState rejects state-mismatch against persisted state", async () => {
    await Workflows.recordDecision(ctx);
    await Workflows.transitionConversionState({
      ctx,
      from: "decided",
      to: "payment-initiated",
    });
    const bad = await Workflows.transitionConversionState({
      ctx,
      from: "decided",
      to: "payment-initiated",
    });
    expect(bad.ok).toBe(false);
    if (bad.ok) return;
    expect(bad.reason).toBe("state-mismatch");
    expect(bad.state).toBe("payment-initiated");
  });

  test("transitionConversionState seeds a record if none exists (first move from 'decided')", async () => {
    const result = await Workflows.transitionConversionState({
      ctx,
      from: "decided",
      to: "payment-initiated",
    });
    expect(result.ok).toBe(true);
    const persisted = await Workflows.getConversionRecord({
      userId: "u1",
      listingId: "L1",
    });
    expect(persisted?.state).toBe("payment-initiated");
    expect(persisted?.path).toBe("picknbuild");
  });
});

describe("onDepositReceived", () => {
  test("creates a DealRecord, indexes it per-user, and emits a deal-status notification", async () => {
    const build = makeFixtureBuildRecord({
      id: "b1",
      userId: "u1",
      listingId: "L1",
      selectedPackage: "premium",
      customizations: { wrap: true, seats: false },
      attachments: [{ type: "link", ref: "https://a.example/link" }],
    });
    const agreement = makeFixtureAgreementDocument({
      id: "a1",
      userId: "u1",
      buildRecordId: "b1",
      renderedSpecSummary: "2019-2021 Honda Accord",
    });
    store.set(`build_records:b1`, build);
    store.set(`agreements:a1`, agreement);

    const deal = await Workflows.onDepositReceived({
      userId: "u1",
      buildRecordId: "b1",
      agreementId: "a1",
      paymentId: "p1",
      pricing: { total: 22000, down: 1000, biweekly: 200, term: "3y" },
    });

    expect(deal.status).toBe<DealStatus>("build-started");
    expect(deal.package).toBe("premium");
    expect(deal.listingId).toBe("L1");
    expect(deal.committedSpec.makeModelYearRange).toBe("2019-2021 Honda Accord");
    expect(deal.committedSpec.customizations).toEqual(["wrap"]);
    expect(deal.committedSpec.attachments).toEqual(["https://a.example/link"]);
    expect(deal.timeline).toEqual([
      { stage: "build-started", occurredAt: expect.any(String) },
    ]);
    expect(deal.agreementId).toBe("a1");
    expect(deal.buildRecordId).toBe("b1");

    // Persisted under bucket "deals"
    expect(putRecord).toHaveBeenCalledWith(
      "deals",
      deal.id,
      expect.objectContaining({ id: deal.id }),
    );

    // Per-user deal index carries the new id
    const index = store.get(`deals_by_user:u1`) as string[] | undefined;
    expect(index).toContain(deal.id);

    // Notification emitted
    expect(emitNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u1", category: "deal-status" }),
    );
  });

  test("advances the conversion state machine to post-deposit when listingId is known", async () => {
    // Seed a decided record on L1
    await Workflows.recordDecision({
      userId: "u1",
      listingId: "L1",
      path: "picknbuild",
    });

    const build = makeFixtureBuildRecord({
      id: "b2",
      userId: "u1",
      listingId: "L1",
    });
    store.set(`build_records:b2`, build);

    await Workflows.onDepositReceived({
      userId: "u1",
      buildRecordId: "b2",
      agreementId: "a2",
      paymentId: "p2",
    });

    const state = await Workflows.getConversionState({
      userId: "u1",
      listingId: "L1",
    });
    expect(state).toBe("post-deposit");
  });

  test("listDealsForUser hydrates persisted deals via the user index", async () => {
    const build = makeFixtureBuildRecord({ id: "b3", userId: "u1" });
    store.set(`build_records:b3`, build);
    const dealA = await Workflows.onDepositReceived({
      userId: "u1",
      buildRecordId: "b3",
      agreementId: "a3",
      paymentId: "p3",
    });
    const dealB = await Workflows.onDepositReceived({
      userId: "u1",
      buildRecordId: "b3",
      agreementId: "a3",
      paymentId: "p4",
    });

    const deals = await Workflows.listDealsForUser("u1");
    const ids = deals.map((d) => d.id).sort();
    expect(ids).toEqual([dealA.id, dealB.id].sort());
  });
});

describe("advanceBuildStartedWorkflow", () => {
  const seedDeal = async (status: DealStatus = "build-started") => {
    const build = makeFixtureBuildRecord({ id: "bx", userId: "u1" });
    store.set(`build_records:bx`, build);
    const deal = await Workflows.onDepositReceived({
      userId: "u1",
      buildRecordId: "bx",
      agreementId: "ax",
      paymentId: "px",
    });
    if (status !== "build-started") {
      const latest = (await Workflows.getDeal(deal.id)) as DealRecord;
      store.set(`deals:${deal.id}`, { ...latest, status });
    }
    emitNotification.mockClear();
    return deal;
  };

  test("happy path build-started → sourcing → purchased → in-transit → delivered", async () => {
    const deal = await seedDeal();
    const progression: DealStatus[] = [
      "sourcing",
      "purchased",
      "in-transit",
      "delivered",
    ];
    for (const toStatus of progression) {
      const r = await Workflows.advanceBuildStartedWorkflow({
        dealId: deal.id,
        toStatus,
      });
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.status).toBe(toStatus);
    }
    const final = await Workflows.getDeal(deal.id);
    expect(final?.status).toBe("delivered");
    expect(final?.timeline.map((e) => e.stage)).toEqual([
      "build-started",
      "sourcing",
      "purchased",
      "in-transit",
      "delivered",
    ]);
  });

  test("rejects non-sequential transitions", async () => {
    const deal = await seedDeal();
    const r = await Workflows.advanceBuildStartedWorkflow({
      dealId: deal.id,
      toStatus: "purchased",
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("illegal-status-transition");
  });

  test("allows sideways move to surrendered from any non-terminal status", async () => {
    const deal = await seedDeal("sourcing");
    const r = await Workflows.advanceBuildStartedWorkflow({
      dealId: deal.id,
      toStatus: "surrendered",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.status).toBe("surrendered");
  });

  test("rejects advance from a terminal status", async () => {
    const deal = await seedDeal("delivered");
    const r = await Workflows.advanceBuildStartedWorkflow({
      dealId: deal.id,
      toStatus: "in-transit",
    });
    expect(r.ok).toBe(false);
  });

  test("returns deal-not-found for an unknown dealId", async () => {
    const r = await Workflows.advanceBuildStartedWorkflow({
      dealId: "missing",
      toStatus: "sourcing",
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("deal-not-found");
  });
});

describe("dealer-lead flow", () => {
  test("createDealerLead persists the lead and notifies the dealer", async () => {
    const lead = await Workflows.createDealerLead({
      userId: "buyer1",
      dealerId: "dealer1",
      listingId: "L1",
    });
    expect(lead.status).toBe("sent");
    expect(lead.userId).toBe("buyer1");
    expect(lead.dealerId).toBe("dealer1");
    expect(putRecord).toHaveBeenCalledWith(
      "dealer_leads",
      lead.id,
      expect.objectContaining({ id: lead.id }),
    );
    expect(emitNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "dealer1",
        category: "dealer-response",
      }),
    );
  });

  test("advanceDealerLead walks sent → unlocked → responded → closed", async () => {
    const lead = await Workflows.createDealerLead({
      userId: "u",
      dealerId: "d",
      listingId: "L",
    });
    for (const toStatus of ["unlocked", "responded", "closed"] as const) {
      const r = await Workflows.advanceDealerLead({
        leadId: lead.id,
        toStatus,
      });
      expect(r.ok).toBe(true);
    }
    const final = await Workflows.getDealerLead(lead.id);
    expect(final?.status).toBe("closed");
  });

  test("advanceDealerLead rejects illegal jumps", async () => {
    const lead = await Workflows.createDealerLead({
      userId: "u",
      dealerId: "d",
      listingId: "L",
    });
    const r = await Workflows.advanceDealerLead({
      leadId: lead.id,
      toStatus: "responded",
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("illegal-status-transition");
  });
});

describe("private-seller invite flow", () => {
  test("createSellerInvite persists the invite and notifies the buyer", async () => {
    const invite = await Workflows.createSellerInvite({
      userId: "buyer1",
      sellerContact: "+15550101",
      listingId: "L-private",
    });
    expect(invite.status).toBe("invited");
    expect(putRecord).toHaveBeenCalledWith(
      "seller_invites",
      invite.id,
      expect.objectContaining({ id: invite.id }),
    );
    expect(emitNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "buyer1", category: "system" }),
    );
  });

  test("updateSellerInviteStatus marks onboarded or ignored", async () => {
    const invite = await Workflows.createSellerInvite({
      userId: "u",
      sellerContact: "x",
      listingId: "L",
    });
    const r = await Workflows.updateSellerInviteStatus({
      inviteId: invite.id,
      toStatus: "onboarded",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.invite.status).toBe("onboarded");
  });

  test("updateSellerInviteStatus returns invite-not-found for unknown id", async () => {
    const r = await Workflows.updateSellerInviteStatus({
      inviteId: "nope",
      toStatus: "ignored",
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("invite-not-found");
  });
});
