import { NextResponse } from "next/server";
import { loadSession } from "@/services/team-01-auth";

export async function GET() {
  const session = await loadSession();
  if (session.state === "anonymous") {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  if (session.state === "needs-onboarding") {
    return NextResponse.json(
      { user: null, needsOnboarding: true, userId: session.userId },
      { status: 200 },
    );
  }
  return NextResponse.json({ user: session.user });
}
