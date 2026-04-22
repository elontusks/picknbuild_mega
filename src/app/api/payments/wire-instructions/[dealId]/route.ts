import { NextResponse } from "next/server";
import { loadPrincipal } from "@/lib/authz/server/principal-loader";
import {
  getWireInstructions,
  listPaymentsForDeal,
} from "@/services/team-14-payments";

type Ctx = { params: Promise<{ dealId: string }> };

// The escrow routing / account numbers are shared across every deal, but the
// reference string encodes the dealId and showing these to the wrong user
// would let a third party wire funds against a deal they don't own. Gate by
// "does this principal have at least one PaymentRecord tied to this deal" —
// the deposit row Team 14 creates satisfies this for the buyer. Admins can
// always see wire instructions.
export async function GET(_req: Request, ctx: Ctx) {
  const principal = await loadPrincipal();
  if (!principal) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const { dealId } = await ctx.params;

  if (!principal.roles.includes("admin")) {
    const payments = await listPaymentsForDeal(dealId);
    const ownsDeal = payments.some((p) => p.userId === principal.id);
    if (!ownsDeal) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  const wire = await getWireInstructions({ dealId });
  return NextResponse.json({ wire });
}
