"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { logEvent } from "@/services/team-15-logging";
import { recordModerationAction } from "@/lib/admin/moderation";
import {
  recordIngestionHeartbeat,
  type IngestionRun,
} from "@/lib/admin/ingestion";
import { markListingStatus } from "@/services/team-03-supply";
import {
  DEAL_REQUESTS_BUCKET,
  getDealRequest,
} from "@/services/team-10-dashboard";
import { compareAndSetRecord } from "@/services/team-15-storage";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionResult = { ok: true } | { ok: false; error: string };

// -- listing moderation --------------------------------------------------

export async function removeListingAction(input: {
  listingId: string;
  note?: string;
}): Promise<ActionResult> {
  const admin = await requireAdmin();
  try {
    await markListingStatus(input.listingId, "removed");
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "failed to remove listing",
    };
  }
  await Promise.all([
    recordModerationAction({
      actor: admin.id,
      targetKind: "listing",
      targetId: input.listingId,
      action: "remove",
      ...(input.note ? { note: input.note } : {}),
    }),
    logEvent({
      actor: admin.id,
      action: "listing.remove",
      target: input.listingId,
      ...(input.note ? { metadata: { note: input.note } } : {}),
    }),
  ]);
  revalidatePath("/admin/listings");
  revalidatePath(`/admin/listings/${input.listingId}`);
  return { ok: true };
}

export async function markListingStaleAction(input: {
  listingId: string;
}): Promise<ActionResult> {
  const admin = await requireAdmin();
  try {
    await markListingStatus(input.listingId, "stale");
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "failed",
    };
  }
  await Promise.all([
    recordModerationAction({
      actor: admin.id,
      targetKind: "listing",
      targetId: input.listingId,
      action: "mark-stale",
    }),
    logEvent({
      actor: admin.id,
      action: "listing.mark-stale",
      target: input.listingId,
    }),
  ]);
  revalidatePath("/admin/listings");
  revalidatePath(`/admin/listings/${input.listingId}`);
  return { ok: true };
}

// -- deal request moderation --------------------------------------------

export async function acknowledgeDealRequestAction(input: {
  requestId: string;
}): Promise<ActionResult> {
  const admin = await requireAdmin();
  const existing = await getDealRequest(input.requestId);
  if (!existing) return { ok: false, error: "request not found" };
  if (existing.status !== "submitted") {
    return {
      ok: false,
      error: `request already in status "${existing.status}"`,
    };
  }
  // CAS: two admins hitting this at the same time would both pass the
  // guard above under a naive read-then-put. Push the transition into a
  // single UPDATE so whoever loses the race walks away with `false` and
  // no second log row gets written.
  const updated = await compareAndSetRecord(
    DEAL_REQUESTS_BUCKET,
    existing.id,
    existing,
    { ...existing, status: "acknowledged" as const },
  );
  if (!updated) {
    return {
      ok: false,
      error: "request changed underneath us; refresh and try again",
    };
  }
  await Promise.all([
    recordModerationAction({
      actor: admin.id,
      targetKind: "deal_request",
      targetId: input.requestId,
      action: "acknowledge",
    }),
    logEvent({
      actor: admin.id,
      action: "deal_request.acknowledge",
      target: input.requestId,
      metadata: { dealId: existing.dealId, kind: existing.kind },
    }),
  ]);
  revalidatePath("/admin/deals");
  return { ok: true };
}

// -- user moderation / privacy ------------------------------------------

export async function suspendUserAction(input: {
  userId: string;
  note?: string;
}): Promise<ActionResult> {
  const admin = await requireAdmin();
  const db = createAdminClient();
  const { error } = await db
    .from("profiles")
    .update({ account_status: "suspended" })
    .eq("id", input.userId);
  if (error) return { ok: false, error: error.message };
  await Promise.all([
    recordModerationAction({
      actor: admin.id,
      targetKind: "user",
      targetId: input.userId,
      action: "suspend",
      ...(input.note ? { note: input.note } : {}),
    }),
    logEvent({
      actor: admin.id,
      action: "user.suspend",
      target: input.userId,
      ...(input.note ? { metadata: { note: input.note } } : {}),
    }),
  ]);
  revalidatePath(`/admin/users/${input.userId}`);
  revalidatePath("/admin/users");
  return { ok: true };
}

// Data Privacy Controls: reset the financial fields an admin might need to
// scrub on request. Non-contractual only — we never touch DealRecord /
// PaymentRecord or the user's deal history here. Everything gets logged.
export async function resetUserFinancialsAction(input: {
  userId: string;
  note?: string;
}): Promise<ActionResult> {
  const admin = await requireAdmin();
  const db = createAdminClient();
  const { error } = await db
    .from("profiles")
    .update({ budget: null, credit_score: null, no_credit: false })
    .eq("id", input.userId);
  if (error) return { ok: false, error: error.message };
  await logEvent({
    actor: admin.id,
    action: "user.reset-financials",
    target: input.userId,
    ...(input.note ? { metadata: { note: input.note } } : {}),
  });
  revalidatePath(`/admin/users/${input.userId}`);
  return { ok: true };
}

// -- ingestion heartbeat -----------------------------------------------

export async function recordIngestionHeartbeatAction(input: {
  source: string;
  status: IngestionRun["status"];
  ingested?: number;
  note?: string;
}): Promise<{ ok: true; run: IngestionRun } | { ok: false; error: string }> {
  const admin = await requireAdmin();
  const entry = await recordIngestionHeartbeat(input);
  await logEvent({
    actor: admin.id,
    action: "ingestion.heartbeat",
    target: entry.id,
    metadata: {
      source: entry.source,
      status: entry.status,
      ingested: entry.ingested,
    },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/monitoring");
  return { ok: true, run: entry };
}

// -- sponsor catalog ---------------------------------------------------

export type SponsorUpsertInput = {
  id?: string;
  path: "dealer" | "auction" | "picknbuild" | "private";
  title: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaHref?: string;
  sortOrder?: number;
  active?: boolean;
};

// Trust boundary: `bodyHtml` is stored raw and rendered by Team 5's
// sponsor board via `dangerouslySetInnerHTML`. That's intentional — ops
// wants to paste tracked-link anchors and styled copy — but it means this
// action is a stored-XSS sink by design. The requireAdmin() gate is the
// only thing standing between a sponsor write and arbitrary HTML landing
// on every shopper's search screen, so keep it here and do NOT export a
// non-admin codepath.
export async function upsertSponsorAction(
  input: SponsorUpsertInput,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!input.title.trim()) {
    return { ok: false, error: "Title is required." };
  }
  const id =
    input.id ??
    (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? `sponsor_${crypto.randomUUID()}`
      : `sponsor_${Date.now()}`);
  const db = createAdminClient();
  const { error } = await db.from("sponsor_blocks").upsert(
    {
      id,
      path: input.path,
      title: input.title,
      body_html: input.bodyHtml,
      cta_label: input.ctaLabel ?? null,
      cta_href: input.ctaHref ?? null,
      active: input.active ?? true,
      sort_order: input.sortOrder ?? 0,
    },
    { onConflict: "id" },
  );
  if (error) return { ok: false, error: error.message };
  await logEvent({
    actor: admin.id,
    action: input.id ? "sponsor.update" : "sponsor.create",
    target: id,
    metadata: { path: input.path, active: input.active ?? true },
  });
  revalidatePath("/admin/sponsors");
  return { ok: true };
}

export async function toggleSponsorActiveAction(input: {
  id: string;
  active: boolean;
}): Promise<ActionResult> {
  const admin = await requireAdmin();
  const db = createAdminClient();
  const { error } = await db
    .from("sponsor_blocks")
    .update({ active: input.active })
    .eq("id", input.id);
  if (error) return { ok: false, error: error.message };
  await logEvent({
    actor: admin.id,
    action: "sponsor.toggle-active",
    target: input.id,
    metadata: { active: input.active },
  });
  revalidatePath("/admin/sponsors");
  return { ok: true };
}
