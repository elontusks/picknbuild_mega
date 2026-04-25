import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Dev-only convenience: sign in as the dummy admin seeded by
// scripts/seed-dummy-admin.mjs. The seed script provisioned the user with
// phone +16146207536, zip 43065, role admin, and the fixed dev password
// below. Calling signInWithPassword via the @supabase/ssr server client
// sets the auth cookie on localhost — which a Supabase-domain magic link
// cannot do.
//
// This is gated by NODE_ENV — in any other environment the route 404s.

const EMAIL = "admin-dummy@picknbuild.local";
const PASSWORD = "DummyAdmin!43065";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });
  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        hint: "Run `node --env-file=.env scripts/seed-dummy-admin.mjs` first.",
      },
      { status: 500 },
    );
  }
  return NextResponse.redirect(new URL("/admin", "http://localhost:3000"));
}
