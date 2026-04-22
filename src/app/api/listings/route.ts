import { NextResponse } from "next/server";
import { requireCap } from "@/lib/authz/server/require-cap";
import { CAPABILITIES as C } from "@/lib/authz/capabilities";

// Phase 2/3 smoke test. No DB writes, no real feature — this exists solely
// to prove the engine → server → audit chain works end-to-end.
export const POST = requireCap(C.listings.create)(
  async (_req, _ctx, principal) => {
    return NextResponse.json({
      ok: true,
      stub: true,
      userId: principal.id,
      roles: principal.roles,
    });
  },
);
