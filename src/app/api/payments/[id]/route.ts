import { NextResponse } from "next/server";
import { loadPrincipal } from "@/lib/authz/server/principal-loader";
import { getPayment } from "@/services/team-14-payments";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const principal = await loadPrincipal();
  if (!principal) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const record = await getPayment(id);
  if (!record) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }
  if (record.userId !== principal.id && !principal.roles.includes("admin")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return NextResponse.json({ payment: record });
}
