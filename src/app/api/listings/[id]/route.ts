import { NextResponse } from "next/server";
import { requireCap } from "@/lib/authz/server/require-cap";
import { CAPABILITIES as C } from "@/lib/authz/capabilities";
import { getListing } from "@/services/team-03-supply";

type Ctx = { params: Promise<{ id: string }> };

export const GET = requireCap<Ctx>(C.listings.view)(async (_req, ctx) => {
  const { id } = await ctx.params;
  const listing = await getListing(id);
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  return NextResponse.json({ listing });
});
