import { NextResponse, type NextRequest } from "next/server";
import { loadPrincipal } from "@/lib/authz/server/principal-loader";
import { getPayment, issueRefund } from "@/services/team-14-payments";

type Body = { paymentId?: string; reason?: string; amount?: number };

export async function POST(req: NextRequest) {
  const principal = await loadPrincipal();
  if (!principal) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.paymentId) {
    return NextResponse.json({ error: "paymentId required" }, { status: 400 });
  }
  const original = await getPayment(body.paymentId);
  if (!original) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }
  // Users can request refunds on their own payments; admins can refund any.
  if (
    original.userId !== principal.id &&
    !principal.roles.includes("admin")
  ) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  try {
    const refund = await issueRefund({
      paymentId: body.paymentId,
      reason: body.reason,
      amount: body.amount,
    });
    return NextResponse.json({ refund }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "refund-failed" },
      { status: 502 },
    );
  }
}
