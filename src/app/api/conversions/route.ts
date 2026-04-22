import { NextResponse } from "next/server";
import { requireCap } from "@/lib/authz/server/require-cap";
import { CAPABILITIES as C } from "@/lib/authz/capabilities";
import {
  getConversionState,
  transitionConversionState,
} from "@/services/team-12-workflows";
import type { ConversionState, PathKind } from "@/contracts";

const PATHS: readonly PathKind[] = [
  "dealer",
  "auction",
  "picknbuild",
  "private",
];
const STATES: readonly ConversionState[] = [
  "decided",
  "payment-initiated",
  "deposit-received",
  "post-deposit",
];

export const GET = requireCap(C.listings.view)(async (req, _ctx, principal) => {
  const url = new URL(req.url);
  const listingId = url.searchParams.get("listingId");
  if (!listingId) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }
  const state = await getConversionState({
    userId: principal.id,
    listingId,
  });
  return NextResponse.json({ state });
});

export const POST = requireCap(C.listings.view)(async (req, _ctx, principal) => {
  const body = (await req.json().catch(() => ({}))) as {
    listingId?: string;
    path?: PathKind;
    from?: ConversionState;
    to?: ConversionState;
  };
  const { listingId, path, from, to } = body;
  if (!listingId || !path || !from || !to) {
    return NextResponse.json(
      { error: "listingId, path, from, to required" },
      { status: 400 },
    );
  }
  if (!PATHS.includes(path)) {
    return NextResponse.json({ error: "invalid path" }, { status: 400 });
  }
  if (!STATES.includes(from) || !STATES.includes(to)) {
    return NextResponse.json({ error: "invalid state" }, { status: 400 });
  }
  const result = await transitionConversionState({
    ctx: { userId: principal.id, listingId, path },
    from,
    to,
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 409 });
});
