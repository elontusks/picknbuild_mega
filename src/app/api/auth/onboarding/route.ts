import { NextResponse, type NextRequest } from "next/server";
import { saveOnboarding, type OnboardingInput } from "@/services/team-01-auth";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Partial<OnboardingInput>;
  const result = await saveOnboarding(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, user: result.user });
}
