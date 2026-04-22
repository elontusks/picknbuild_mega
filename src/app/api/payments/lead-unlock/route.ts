import { NextResponse, type NextRequest } from "next/server";
import { loadPrincipal } from "@/lib/authz/server/principal-loader";
import { chargeLeadUnlock } from "@/services/team-14-payments";

type Body = {
  leadId?: string;
  paymentMethodId?: string;
  stripeCustomerId?: string;
};

export async function POST(req: NextRequest) {
  const principal = await loadPrincipal();
  if (!principal) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  if (!principal.roles.includes("dealer")) {
    return NextResponse.json({ error: "dealer-only" }, { status: 403 });
  }
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.leadId) {
    return NextResponse.json({ error: "leadId required" }, { status: 400 });
  }
  try {
    const result = await chargeLeadUnlock({
      dealerId: principal.id,
      leadId: body.leadId,
      paymentMethodId: body.paymentMethodId,
      stripeCustomerId: body.stripeCustomerId,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "charge-failed" },
      { status: 502 },
    );
  }
}
