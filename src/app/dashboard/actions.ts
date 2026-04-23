"use server";

import { revalidatePath } from "next/cache";
import {
  nextFixtureId,
  nowIso,
  type ConversionState,
  type DealRecord,
  type PaymentRecord,
} from "@/contracts";
import { requireUser } from "@/services/team-01-auth";
import {
  getDeal,
  listDealsForUser,
  getConversionState,
} from "@/services/team-12-workflows";
import {
  listPaymentsForDeal,
  listPaymentsForUser,
  getWireInstructions,
  type WireInstructions,
} from "@/services/team-14-payments";
import {
  putDealRequest,
  listDealRequestsForDeal,
} from "@/lib/deal-requests/storage";
import type { DealRequest, DealRequestKind } from "@/lib/deal-requests/types";

// Ownership guard. Every read that surfaces a deal must go through here — the
// raw Team 12 `getDeal(id)` call returns any deal by id, so pairing it with
// `requireUser` and a userId match is the only way the dashboard doesn't leak.
type DealAccess =
  | { ok: true; deal: DealRecord }
  | { ok: false; reason: "not-found" | "forbidden" };

const loadDealForUser = async (input: {
  dealId: string;
  userId: string;
}): Promise<DealAccess> => {
  const deal = await getDeal(input.dealId);
  if (!deal) return { ok: false, reason: "not-found" };
  if (deal.userId !== input.userId) return { ok: false, reason: "forbidden" };
  return { ok: true, deal };
};

export type DashboardSnapshot = {
  deal: DealRecord;
  otherDeals: DealRecord[];
  payments: PaymentRecord[];
  wireInstructions: WireInstructions;
  requests: DealRequest[];
  conversionState: ConversionState | null;
};

export type LoadDashboardResult =
  | { ok: true; snapshot: DashboardSnapshot }
  | { ok: false; reason: "no-deals" | "not-found" | "forbidden" };

// Server loader for the dashboard page. When no explicit dealId is given
// we pick the most-recent deal. Every exit path runs through an ownership
// check — `listDealsForUser` already filters by user, and an explicit
// dealId goes through `loadDealForUser` which refuses a foreign deal.
export async function loadDashboard(input?: {
  dealId?: string;
}): Promise<LoadDashboardResult> {
  const viewer = await requireUser();

  const allDeals = await listDealsForUser(viewer.id);
  if (allDeals.length === 0) {
    return { ok: false, reason: "no-deals" };
  }

  let selectedDeal: DealRecord | null = null;
  if (input?.dealId) {
    const access = await loadDealForUser({
      dealId: input.dealId,
      userId: viewer.id,
    });
    if (!access.ok) return { ok: false, reason: access.reason };
    selectedDeal = access.deal;
  } else {
    // Newest first. `listDealsForUser` does not sort; do it here.
    selectedDeal = [...allDeals].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    )[0] ?? null;
  }
  if (!selectedDeal) return { ok: false, reason: "not-found" };

  const dealId = selectedDeal.id;
  const [paymentsForDeal, paymentsForUser, wireInstructions, requests] =
    await Promise.all([
      listPaymentsForDeal(dealId),
      listPaymentsForUser(viewer.id),
      getWireInstructions({ dealId }),
      listDealRequestsForDeal(dealId),
    ]);

  // Include the deposit PaymentRecord — it's tagged to the user and kind
  // "deposit" but may not carry a dealId yet if the webhook is racing the
  // synchronous confirm path. We collapse the two lists so the dashboard
  // always shows the deposit row.
  const byId = new Map<string, PaymentRecord>();
  for (const p of paymentsForDeal) byId.set(p.id, p);
  for (const p of paymentsForUser) {
    if (p.kind === "deposit" && !byId.has(p.id)) byId.set(p.id, p);
  }
  const payments = [...byId.values()].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  // ConversionState is only meaningful when the deal is anchored to a
  // listing — otherwise the picknbuild Build-Started workflow on the
  // deal itself is the state machine the UI should render.
  const conversionState = selectedDeal.listingId
    ? await getConversionState({
        userId: viewer.id,
        listingId: selectedDeal.listingId,
      })
    : null;

  return {
    ok: true,
    snapshot: {
      deal: selectedDeal,
      otherDeals: allDeals.filter((d) => d.id !== selectedDeal!.id),
      payments,
      wireInstructions,
      requests,
      conversionState,
    },
  };
}

export type SubmitDealRequestInput = {
  dealId: string;
  kind: DealRequestKind;
  reason: string;
};

export type SubmitDealRequestResult =
  | { ok: true; requestId: string }
  | { ok: false; error: string };

export async function submitDealRequest(
  input: SubmitDealRequestInput,
): Promise<SubmitDealRequestResult> {
  const viewer = await requireUser();
  const trimmedReason = input.reason?.trim() ?? "";
  if (trimmedReason.length < 3) {
    return {
      ok: false,
      error: "Tell us briefly why — a short reason is required.",
    };
  }
  if (
    input.kind !== "upgrade" &&
    input.kind !== "downgrade" &&
    input.kind !== "surrender"
  ) {
    return { ok: false, error: "Unknown request type." };
  }

  const access = await loadDealForUser({
    dealId: input.dealId,
    userId: viewer.id,
  });
  if (!access.ok) {
    return {
      ok: false,
      error:
        access.reason === "not-found"
          ? "Deal not found."
          : "Not your deal.",
    };
  }

  const request: DealRequest = {
    id: nextFixtureId("dreq"),
    userId: viewer.id,
    dealId: access.deal.id,
    kind: input.kind,
    reason: trimmedReason,
    status: "submitted",
    createdAt: nowIso(),
  };
  await putDealRequest(request);
  revalidatePath("/dashboard");
  return { ok: true, requestId: request.id };
}
