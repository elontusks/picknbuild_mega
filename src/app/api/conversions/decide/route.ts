import { NextResponse } from "next/server";
import { requireCap } from "@/lib/authz/server/require-cap";
import { CAPABILITIES as C } from "@/lib/authz/capabilities";
import { recordDecision } from "@/services/team-12-workflows";
import type { PathKind } from "@/contracts";

const PATHS: readonly PathKind[] = [
  "dealer",
  "auction",
  "picknbuild",
  "private",
];

type Body = {
  listingId?: string;
  path?: PathKind;
};

export const POST = requireCap(C.listings.view)(async (req, _ctx, principal) => {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.listingId || !body?.path) {
    return NextResponse.json(
      { error: "listingId and path are required" },
      { status: 400 },
    );
  }
  if (!PATHS.includes(body.path)) {
    return NextResponse.json({ error: "invalid path" }, { status: 400 });
  }
  const record = await recordDecision({
    userId: principal.id,
    listingId: body.listingId,
    path: body.path,
  });
  return NextResponse.json({ ok: true, record });
});
