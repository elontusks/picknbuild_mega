import { NextResponse } from "next/server";
import { requireCap } from "@/lib/authz/server/require-cap";
import { CAPABILITIES as C } from "@/lib/authz/capabilities";
import { getSponsorsForPath } from "@/services/team-15-storage";
import type { PathKind } from "@/contracts";

const PATHS: readonly PathKind[] = [
  "dealer",
  "auction",
  "picknbuild",
  "private",
];

type Ctx = { params: Promise<{ path: string }> };

export const GET = requireCap<Ctx>(C.listings.view)(async (_req, ctx) => {
  const { path } = await ctx.params;
  if (!PATHS.includes(path as PathKind)) {
    return NextResponse.json({ error: "invalid path" }, { status: 400 });
  }
  try {
    const sponsors = await getSponsorsForPath(path as PathKind);
    return NextResponse.json({ sponsors });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Sponsor fetch failed";
    return NextResponse.json({ error: message, sponsors: [] }, { status: 500 });
  }
});
