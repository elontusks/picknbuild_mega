import { NextResponse } from "next/server";
import { requireCap } from "@/lib/authz/server/require-cap";
import { CAPABILITIES as C } from "@/lib/authz/capabilities";
import { getListing } from "@/services/team-03-supply";
import {
  listGarage,
  saveToGarage,
  type GarageDecision,
} from "@/services/team-08-garage";

const DECISIONS: readonly GarageDecision[] = ["pick", "pass", null];

export const GET = requireCap(C.garage.view_own)(async (_req, _ctx, principal) => {
  const items = await listGarage(principal.id);
  return NextResponse.json({ items });
});

export const POST = requireCap(C.garage.pick)(async (req, _ctx, principal) => {
  const body = (await req.json().catch(() => ({}))) as {
    listingId?: string;
    decision?: GarageDecision;
  };
  const { listingId, decision } = body;
  if (!listingId) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }
  if (decision !== undefined && !DECISIONS.includes(decision)) {
    return NextResponse.json({ error: "invalid decision" }, { status: 400 });
  }
  const listing = await getListing(listingId);
  if (!listing) {
    return NextResponse.json({ error: "listing not found" }, { status: 404 });
  }
  const item = await saveToGarage({
    userId: principal.id,
    listing,
    ...(decision !== undefined ? { decision } : {}),
  });
  return NextResponse.json({ item });
});
