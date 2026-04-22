import "server-only";

import {
  canTransition,
  CONVERSION_STATE_ORDER,
  nowIso,
  type AgreementDocument,
  type BuildRecord,
  type ConversionState,
  type DealCommittedSpec,
  type DealPricing,
  type DealRecord,
  type DealStatus,
  type DealTimelineEntry,
  type ISOTimestamp,
  type PathKind,
} from "@/contracts";
import * as Storage from "./team-15-storage";
import * as Notifications from "./team-13-notifications";

// Team 12 — workflows backend.
//
// Owns:
// - Two-step conversion state machine (decided → payment-initiated →
//   deposit-received → post-deposit), keyed per (userId, listingId).
// - Post-deposit "Build Started" workflow that advances DealRecord.status.
// - External signal flows for dealer-lead + private-seller invite.
//
// All state persists through @/services/team-15-storage so Teams 5, 9, 10,
// 14, 15 read the same source of truth.

// -- buckets --------------------------------------------------------------

const CONVERSION_BUCKET = "conversion_states";
const DEAL_BUCKET = "deals";
const DEAL_INDEX_BUCKET = "deals_by_user";
const BUILD_BUCKET = "build_records";
const AGREEMENT_BUCKET = "agreements";
const DEALER_LEAD_BUCKET = "dealer_leads";
const SELLER_INVITE_BUCKET = "seller_invites";

const conversionKey = (userId: string, listingId: string) =>
  `${userId}:${listingId}`;

const newId = (prefix: string) => {
  const rand =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${rand}`;
};

// Notifications are side-effects — callers shouldn't block on Team 13's
// transport (socket / email fan-out). Fire-and-forget with an error trap so
// a flaky channel doesn't surface as an unhandled rejection or fail the
// workflow it was meant to announce.
const fireNotification = (
  input: Parameters<typeof Notifications.emitNotification>[0],
): void => {
  Notifications.emitNotification(input).catch((err: unknown) => {
    console.error("[team-12-workflows] emitNotification failed", err);
  });
};

// -- conversion state machine --------------------------------------------

export type ConversionContext = {
  userId: string;
  listingId: string;
  path: PathKind;
};

export type ConversionHistoryEntry = {
  state: ConversionState;
  occurredAt: ISOTimestamp;
};

export type ConversionRecord = {
  userId: string;
  listingId: string;
  path: PathKind;
  state: ConversionState;
  history: ConversionHistoryEntry[];
  updatedAt: ISOTimestamp;
};

export const getConversionRecord = async (
  ctx: Pick<ConversionContext, "userId" | "listingId">,
): Promise<ConversionRecord | null> =>
  Storage.getRecord<ConversionRecord>(
    CONVERSION_BUCKET,
    conversionKey(ctx.userId, ctx.listingId),
  );

export const getConversionState = async (
  ctx: Pick<ConversionContext, "userId" | "listingId">,
): Promise<ConversionState> => {
  const record = await getConversionRecord(ctx);
  return record?.state ?? "decided";
};

export const recordDecision = async (
  ctx: ConversionContext,
): Promise<ConversionRecord> => {
  const existing = await getConversionRecord(ctx);
  if (existing) return existing;
  const now = nowIso();
  const record: ConversionRecord = {
    userId: ctx.userId,
    listingId: ctx.listingId,
    path: ctx.path,
    state: "decided",
    history: [{ state: "decided", occurredAt: now }],
    updatedAt: now,
  };
  await Storage.putRecord(
    CONVERSION_BUCKET,
    conversionKey(ctx.userId, ctx.listingId),
    record,
  );
  return record;
};

export type TransitionResult =
  | { ok: true; state: ConversionState; record: ConversionRecord }
  | { ok: false; state: ConversionState; reason: TransitionReason };

export type TransitionReason =
  | "illegal-transition"
  | "state-mismatch"
  | "no-record";

export const transitionConversionState = async (input: {
  ctx: ConversionContext;
  from: ConversionState;
  to: ConversionState;
}): Promise<TransitionResult> => {
  if (!canTransition(input.from, input.to)) {
    return { ok: false, state: input.from, reason: "illegal-transition" };
  }

  const key = conversionKey(input.ctx.userId, input.ctx.listingId);
  const existing = await Storage.getRecord<ConversionRecord>(
    CONVERSION_BUCKET,
    key,
  );

  // Seed the record on the first legal transition (decided → payment-initiated).
  const currentState: ConversionState = existing?.state ?? "decided";
  if (currentState !== input.from) {
    return { ok: false, state: currentState, reason: "state-mismatch" };
  }

  const now = nowIso();
  const base: ConversionRecord =
    existing ?? {
      userId: input.ctx.userId,
      listingId: input.ctx.listingId,
      path: input.ctx.path,
      state: "decided",
      history: [{ state: "decided", occurredAt: now }],
      updatedAt: now,
    };
  const next: ConversionRecord = {
    ...base,
    state: input.to,
    history: [...base.history, { state: input.to, occurredAt: now }],
    updatedAt: now,
  };
  await Storage.putRecord(CONVERSION_BUCKET, key, next);
  return { ok: true, state: input.to, record: next };
};

// -- deposit-received: create DealRecord ---------------------------------

const DEAL_STATUS_FLOW: DealStatus[] = [
  "build-started",
  "sourcing",
  "purchased",
  "in-transit",
  "delivered",
];

const TERMINAL_DEAL_STATUS: DealStatus[] = [
  "delivered",
  "surrendered",
  "cancelled",
];

const defaultCommittedSpec = (build?: BuildRecord): DealCommittedSpec => ({
  makeModelYearRange: "",
  mileageRange: "",
  titleType: build?.tradeIn?.titleStatus === "rebuilt" ? "rebuilt" : "clean",
  customizations: build
    ? Object.entries(build.customizations)
        .filter(([, enabled]) => enabled)
        .map(([key]) => key)
    : [],
  attachments: build?.attachments.map((a) => a.ref) ?? [],
});

const defaultPricing = (): DealPricing => ({
  total: 0,
  down: 1000,
  biweekly: 0,
  term: "3y",
});

export const onDepositReceived = async (input: {
  userId: string;
  buildRecordId: string;
  agreementId: string;
  paymentId: string;
  listingId?: string;
  pricing?: DealPricing;
  committedSpec?: DealCommittedSpec;
}): Promise<DealRecord> => {
  const [build, agreement] = await Promise.all([
    Storage.getRecord<BuildRecord>(BUILD_BUCKET, input.buildRecordId),
    Storage.getRecord<AgreementDocument>(AGREEMENT_BUCKET, input.agreementId),
  ]);

  const now = nowIso();
  const committedSpec: DealCommittedSpec =
    input.committedSpec ??
    (agreement
      ? {
          ...defaultCommittedSpec(build ?? undefined),
          makeModelYearRange: agreement.renderedSpecSummary,
        }
      : defaultCommittedSpec(build ?? undefined));

  const deal: DealRecord = {
    id: newId("deal"),
    userId: input.userId,
    buildRecordId: input.buildRecordId,
    ...(input.listingId !== undefined || build?.listingId !== undefined
      ? { listingId: input.listingId ?? build?.listingId }
      : {}),
    committedSpec,
    package: build?.selectedPackage ?? "standard",
    pricing: input.pricing ?? defaultPricing(),
    status: "build-started",
    timeline: [{ stage: "build-started", occurredAt: now }],
    agreementId: input.agreementId,
    createdAt: now,
  };

  await Storage.putRecord(DEAL_BUCKET, deal.id, deal);
  await appendUserDealIndex(input.userId, deal.id);

  // Advance the conversion state machine to post-deposit if we have listing context.
  const listingId = deal.listingId;
  if (listingId) {
    const key = conversionKey(input.userId, listingId);
    const conversion = await Storage.getRecord<ConversionRecord>(
      CONVERSION_BUCKET,
      key,
    );
    const path: PathKind = conversion?.path ?? "picknbuild";
    // Walk forward through the remaining legal transitions so callers who
    // skipped intermediate states still land on "post-deposit".
    let state: ConversionState = conversion?.state ?? "decided";
    const fromIdx = CONVERSION_STATE_ORDER.indexOf(state);
    const targetIdx = CONVERSION_STATE_ORDER.indexOf("post-deposit");
    for (let i = fromIdx; i < targetIdx; i++) {
      const from = CONVERSION_STATE_ORDER[i];
      const to = CONVERSION_STATE_ORDER[i + 1];
      if (!from || !to) break;
      const result = await transitionConversionState({
        ctx: { userId: input.userId, listingId, path },
        from,
        to,
      });
      if (!result.ok) break;
      state = result.state;
    }
  }

  fireNotification({
    userId: input.userId,
    category: "deal-status",
    payload: {
      dealId: deal.id,
      status: deal.status,
      title: "Your build has started.",
    },
  });

  return deal;
};

const appendUserDealIndex = async (userId: string, dealId: string) => {
  const existing =
    (await Storage.getRecord<string[]>(DEAL_INDEX_BUCKET, userId)) ?? [];
  if (existing.includes(dealId)) return;
  await Storage.putRecord(DEAL_INDEX_BUCKET, userId, [...existing, dealId]);
};

export const getDeal = async (dealId: string): Promise<DealRecord | null> =>
  Storage.getRecord<DealRecord>(DEAL_BUCKET, dealId);

export const listDealsForUser = async (
  userId: string,
): Promise<DealRecord[]> => {
  const ids = (await Storage.getRecord<string[]>(DEAL_INDEX_BUCKET, userId)) ?? [];
  const deals = await Promise.all(
    ids.map((id) => Storage.getRecord<DealRecord>(DEAL_BUCKET, id)),
  );
  return deals.filter((d): d is DealRecord => d !== null);
};

// -- Build Started workflow ----------------------------------------------

export const canAdvanceDealStatus = (
  from: DealStatus,
  to: DealStatus,
): boolean => {
  if (from === to) return false;
  if (TERMINAL_DEAL_STATUS.includes(from)) return false;
  if (to === "surrendered" || to === "cancelled") return true;
  const fromIdx = DEAL_STATUS_FLOW.indexOf(from);
  const toIdx = DEAL_STATUS_FLOW.indexOf(to);
  if (fromIdx === -1 || toIdx === -1) return false;
  return toIdx === fromIdx + 1;
};

export type AdvanceDealResult =
  | { ok: true; dealId: string; status: DealStatus; deal: DealRecord }
  | { ok: false; dealId: string; status: DealStatus; reason: AdvanceDealReason };

export type AdvanceDealReason =
  | "deal-not-found"
  | "illegal-status-transition";

export const advanceBuildStartedWorkflow = async (input: {
  dealId: string;
  toStatus: DealStatus;
}): Promise<AdvanceDealResult> => {
  const deal = await Storage.getRecord<DealRecord>(DEAL_BUCKET, input.dealId);
  if (!deal) {
    return {
      ok: false,
      dealId: input.dealId,
      status: "build-started",
      reason: "deal-not-found",
    };
  }
  if (!canAdvanceDealStatus(deal.status, input.toStatus)) {
    return {
      ok: false,
      dealId: input.dealId,
      status: deal.status,
      reason: "illegal-status-transition",
    };
  }
  const now = nowIso();
  const entry: DealTimelineEntry = {
    stage: input.toStatus,
    occurredAt: now,
  };
  const next: DealRecord = {
    ...deal,
    status: input.toStatus,
    timeline: [...deal.timeline, entry],
  };
  await Storage.putRecord(DEAL_BUCKET, deal.id, next);
  fireNotification({
    userId: deal.userId,
    category: "deal-status",
    payload: { dealId: deal.id, status: input.toStatus },
  });
  return { ok: true, dealId: deal.id, status: input.toStatus, deal: next };
};

// -- External signal flows -----------------------------------------------

export type DealerLeadStatus = "sent" | "unlocked" | "responded" | "closed";

export type DealerLead = {
  id: string;
  userId: string;
  dealerId: string;
  listingId: string;
  status: DealerLeadStatus;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
};

const DEALER_LEAD_FLOW: DealerLeadStatus[] = [
  "sent",
  "unlocked",
  "responded",
  "closed",
];

export const createDealerLead = async (input: {
  userId: string;
  dealerId: string;
  listingId: string;
}): Promise<DealerLead> => {
  const now = nowIso();
  const lead: DealerLead = {
    id: newId("lead"),
    userId: input.userId,
    dealerId: input.dealerId,
    listingId: input.listingId,
    status: "sent",
    createdAt: now,
    updatedAt: now,
  };
  await Storage.putRecord(DEALER_LEAD_BUCKET, lead.id, lead);
  fireNotification({
    userId: input.dealerId,
    category: "dealer-response",
    payload: {
      leadId: lead.id,
      listingId: lead.listingId,
      buyerId: input.userId,
      title: "New buyer lead",
    },
  });
  return lead;
};

export const getDealerLead = async (
  leadId: string,
): Promise<DealerLead | null> => Storage.getRecord<DealerLead>(DEALER_LEAD_BUCKET, leadId);

export const advanceDealerLead = async (input: {
  leadId: string;
  toStatus: DealerLeadStatus;
}): Promise<
  | { ok: true; lead: DealerLead }
  | { ok: false; reason: "lead-not-found" | "illegal-status-transition" }
> => {
  const lead = await Storage.getRecord<DealerLead>(
    DEALER_LEAD_BUCKET,
    input.leadId,
  );
  if (!lead) return { ok: false, reason: "lead-not-found" };
  const fromIdx = DEALER_LEAD_FLOW.indexOf(lead.status);
  const toIdx = DEALER_LEAD_FLOW.indexOf(input.toStatus);
  if (fromIdx === -1 || toIdx !== fromIdx + 1) {
    return { ok: false, reason: "illegal-status-transition" };
  }
  const next: DealerLead = {
    ...lead,
    status: input.toStatus,
    updatedAt: nowIso(),
  };
  await Storage.putRecord(DEALER_LEAD_BUCKET, lead.id, next);
  return { ok: true, lead: next };
};

export type SellerInviteStatus = "invited" | "onboarded" | "ignored";

export type SellerInvite = {
  id: string;
  userId: string;
  sellerContact: string;
  listingId: string;
  status: SellerInviteStatus;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
};

export const createSellerInvite = async (input: {
  userId: string;
  sellerContact: string;
  listingId: string;
}): Promise<SellerInvite> => {
  const now = nowIso();
  const invite: SellerInvite = {
    id: newId("invite"),
    userId: input.userId,
    sellerContact: input.sellerContact,
    listingId: input.listingId,
    status: "invited",
    createdAt: now,
    updatedAt: now,
  };
  await Storage.putRecord(SELLER_INVITE_BUCKET, invite.id, invite);
  fireNotification({
    userId: input.userId,
    category: "system",
    payload: {
      inviteId: invite.id,
      listingId: invite.listingId,
      sellerContact: input.sellerContact,
      title: "Invite sent to private seller",
    },
  });
  return invite;
};

export const getSellerInvite = async (
  inviteId: string,
): Promise<SellerInvite | null> =>
  Storage.getRecord<SellerInvite>(SELLER_INVITE_BUCKET, inviteId);

export const updateSellerInviteStatus = async (input: {
  inviteId: string;
  toStatus: SellerInviteStatus;
}): Promise<
  { ok: true; invite: SellerInvite } | { ok: false; reason: "invite-not-found" }
> => {
  const invite = await Storage.getRecord<SellerInvite>(
    SELLER_INVITE_BUCKET,
    input.inviteId,
  );
  if (!invite) return { ok: false, reason: "invite-not-found" };
  const next: SellerInvite = {
    ...invite,
    status: input.toStatus,
    updatedAt: nowIso(),
  };
  await Storage.putRecord(SELLER_INVITE_BUCKET, invite.id, next);
  return { ok: true, invite: next };
};
