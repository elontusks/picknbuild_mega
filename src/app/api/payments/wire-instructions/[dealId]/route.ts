import { NextResponse } from "next/server";
import { loadPrincipal } from "@/lib/authz/server/principal-loader";
import { getWireInstructions } from "@/services/team-14-payments";

type Ctx = { params: Promise<{ dealId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const principal = await loadPrincipal();
  if (!principal) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const { dealId } = await ctx.params;
  const wire = await getWireInstructions({ dealId });
  return NextResponse.json({ wire });
}
