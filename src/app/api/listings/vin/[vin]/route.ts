import { NextResponse } from "next/server";
import { requireCap } from "@/lib/authz/server/require-cap";
import { CAPABILITIES as C } from "@/lib/authz/capabilities";
import { lookupVin } from "@/services/team-03-supply";

type Ctx = { params: Promise<{ vin: string }> };

export const GET = requireCap<Ctx>(C.listings.view)(async (_req, ctx) => {
  const { vin } = await ctx.params;
  const result = await lookupVin(vin);
  if (!result.ok) {
    const status = result.reason === "invalid-vin" ? 400 : 404;
    return NextResponse.json({ error: result.reason }, { status });
  }
  return NextResponse.json({ result: result.result });
});
