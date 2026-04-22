import { NextResponse } from "next/server";
import { requireCap } from "@/lib/authz/server/require-cap";
import { CAPABILITIES as C } from "@/lib/authz/capabilities";
import {
  updateDecision,
  type GarageDecision,
} from "@/services/team-08-garage";

type Ctx = { params: Promise<{ listingId: string }> };

const DECISIONS: ReadonlySet<GarageDecision> = new Set<GarageDecision>([
  "pick",
  "pass",
  null,
]);

/**
 * POST /api/garage/[listingId]/decision — flip the per-item pass/pick flag.
 * No ownership resolver: the write is scoped to the principal by
 * `updateDecision({ userId: principal.id, ... })`, mirroring how
 * `/api/garage` handles the CRUD pair.
 */
export const POST = requireCap<Ctx>(C.garage.pick)(
  async (req, ctx, principal) => {
    const { listingId } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as {
      decision?: GarageDecision;
    };
    if (!DECISIONS.has(body.decision ?? null)) {
      return NextResponse.json(
        { error: "invalid decision" },
        { status: 400 },
      );
    }
    const decision: GarageDecision = body.decision ?? null;
    const item = await updateDecision({
      userId: principal.id,
      listingId,
      decision,
    });
    if (!item) {
      return NextResponse.json({ error: "not saved" }, { status: 404 });
    }
    return NextResponse.json({ item });
  },
);
