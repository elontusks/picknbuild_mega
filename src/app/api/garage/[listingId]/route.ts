import { NextResponse } from "next/server";
import { requireCap } from "@/lib/authz/server/require-cap";
import { CAPABILITIES as C } from "@/lib/authz/capabilities";
import { loadPrincipal } from "@/lib/authz/server/principal-loader";
import {
  getSavedItem,
  removeFromGarage,
} from "@/services/team-08-garage";

type Ctx = { params: Promise<{ listingId: string }> };

/**
 * DELETE /api/garage/[listingId] — remove a saved vehicle from the signed-in
 * user's garage. Garage records are keyed off (userId, listingId) inside the
 * storage service, so the ownership check is implicit: the record we look up
 * belongs to the principal by construction, and we scope the write to the
 * same pair.
 */
export const DELETE = requireCap<Ctx>(
  C.garage.unpick,
  async (_req, ctx) => {
    // Resolve against the principal itself for ownership — garage records
    // are self-owned by definition (the buyer is the only actor who can
    // pick/unpick) — but use the listingId as the resource id so audit logs
    // and authz telemetry can attribute denials to the row being unpicked.
    const principal = await loadPrincipal();
    if (!principal) return undefined;
    const { listingId } = await ctx.params;
    return { type: "garage_item", id: listingId, owner_id: principal.id };
  },
)(async (_req, ctx, principal) => {
  const { listingId } = await ctx.params;
  const existing = await getSavedItem(principal.id, listingId);
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await removeFromGarage(principal.id, listingId);
  return NextResponse.json({ ok: true });
});
