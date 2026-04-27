import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const mode = typeof body?.mode === "string" ? body.mode : "signup";

  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const supabase = await createClient();
  const redirectUrl = new URL("/auth/callback", request.url);
  redirectUrl.searchParams.set("next", mode === "signup" ? "/onboarding" : "/browse");

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectUrl.toString(),
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
