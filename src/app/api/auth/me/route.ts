import { NextResponse } from "next/server";
import { loadPrincipal } from "@/lib/authz/server/principal-loader";

export async function GET() {
  const principal = await loadPrincipal();
  if (!principal) {
    return NextResponse.json({ principal: null }, { status: 401 });
  }
  return NextResponse.json({ principal });
}
