import { NextResponse, type NextRequest } from "next/server";
import { verifyPhoneOtp } from "@/services/team-01-auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (!phone || !code) {
    return NextResponse.json(
      { error: "phone and code required" },
      { status: 400 },
    );
  }
  const result = await verifyPhoneOtp(phone, code);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({
    ok: true,
    userId: result.userId,
    needsOnboarding: result.needsOnboarding,
  });
}
