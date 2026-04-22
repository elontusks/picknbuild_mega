import { NextResponse, type NextRequest } from "next/server";
import { startPhoneOtp } from "@/services/team-01-auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  if (!phone) {
    return NextResponse.json({ error: "phone required" }, { status: 400 });
  }
  const result = await startPhoneOtp(phone);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
