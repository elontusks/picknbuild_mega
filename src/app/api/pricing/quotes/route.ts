import { NextResponse } from "next/server";
import { requireCap } from "@/lib/authz/server/require-cap";
import { CAPABILITIES as C } from "@/lib/authz/capabilities";
import { getListing } from "@/services/team-03-supply";
import { quoteAllPaths } from "@/services/team-11-pricing";
import type { IntakeState } from "@/contracts";

type Body = {
  listingId?: string;
  intake?: IntakeState;
};

export const POST = requireCap(C.listings.view)(async (req) => {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.listingId || !body?.intake) {
    return NextResponse.json(
      { error: "listingId and intake are required" },
      { status: 400 },
    );
  }
  const listing = await getListing(body.listingId);
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  const quotes = await quoteAllPaths(listing, body.intake);
  return NextResponse.json({ quotes });
});
