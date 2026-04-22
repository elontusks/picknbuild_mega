import { NextResponse, type NextRequest } from "next/server";
import { loadPrincipal } from "@/lib/authz/server/principal-loader";
import { chargeBalance } from "@/services/team-14-payments";

type Body = {
  dealId?: string;
  amount?: number;
  paymentMethodId?: string;
  stripeCustomerId?: string;
};

export async function POST(req: NextRequest) {
  const principal = await loadPrincipal();
  if (!principal) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.dealId || typeof body.amount !== "number" || body.amount <= 0) {
    return NextResponse.json(
      { error: "dealId and positive amount required" },
      { status: 400 },
    );
  }
  try {
    const result = await chargeBalance({
      userId: principal.id,
      dealId: body.dealId,
      amount: body.amount,
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
