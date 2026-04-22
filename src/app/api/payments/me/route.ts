import { NextResponse } from "next/server";
import { loadPrincipal } from "@/lib/authz/server/principal-loader";
import { listPaymentsForUser } from "@/services/team-14-payments";

export async function GET() {
  const principal = await loadPrincipal();
  if (!principal) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const payments = await listPaymentsForUser(principal.id);
  return NextResponse.json({ payments });
}
