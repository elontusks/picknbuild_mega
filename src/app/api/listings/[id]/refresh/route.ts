import { NextResponse } from "next/server";
import { requireCap } from "@/lib/authz/server/require-cap";
import { CAPABILITIES as C } from "@/lib/authz/capabilities";
import { refreshListing } from "@/services/team-03-supply";

type Ctx = { params: Promise<{ id: string }> };

export const POST = requireCap<Ctx>(C.listings.view)(async (_req, ctx) => {
  const { id } = await ctx.params;
  const result = await refreshListing(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 404 });
  }
  return NextResponse.json({
    listing: result.listing,
    refreshed: result.refreshed,
    reason: result.reason,
  });
});
