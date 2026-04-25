// One-off provisioning script for a dummy admin account.
//
// Why this exists: the app's login UI is phone-OTP only (Supabase Phone Auth
// → Twilio). Without Twilio configured we can't trigger an SMS, so we
// instead (1) create the auth user with phone + email pre-confirmed and a
// known password via the service-role admin API, (2) fully populate the
// profile so loadSession() returns "ready", (3) put 'admin' in roles[].
//
// To sign in: visit /api/dev/admin-login in dev — that route calls
// signInWithPassword server-side, which sets cookies on localhost via
// @supabase/ssr (a Supabase-domain magic link can't, hence the password
// path).
//
// Run from the repo root:
//   node --env-file=.env scripts/seed-dummy-admin.mjs
//
// Re-running is idempotent: refreshes profile + password.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY. Run with:",
  );
  console.error("  node --env-file=.env scripts/seed-dummy-admin.mjs");
  process.exit(1);
}

const PHONE = "+16146207536";
const EMAIL = "admin-dummy@picknbuild.local";
const PASSWORD = "DummyAdmin!43065"; // dev-only; route is gated by NODE_ENV
const ZIP = "43065";
const DISPLAY_NAME = "Dummy Admin";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findExistingUser() {
  // Supabase admin listUsers paginates. 200/page is plenty for a small project.
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (error) throw new Error(`listUsers: ${error.message}`);
  return (
    data.users.find((u) => u.email === EMAIL) ??
    data.users.find((u) => normalizePhone(u.phone) === normalizePhone(PHONE)) ??
    null
  );
}

function normalizePhone(p) {
  if (!p) return "";
  return p.replace(/[^\d]/g, "");
}

async function ensureUser() {
  const existing = await findExistingUser();
  if (existing) {
    console.log(`Found existing auth user ${existing.id}; refreshing.`);
    const { data, error } = await supabase.auth.admin.updateUserById(
      existing.id,
      {
        email: EMAIL,
        phone: PHONE,
        password: PASSWORD,
        email_confirm: true,
        phone_confirm: true,
      },
    );
    if (error) throw new Error(`updateUserById: ${error.message}`);
    return data.user;
  }
  console.log("No existing user — creating fresh one.");
  const { data, error } = await supabase.auth.admin.createUser({
    email: EMAIL,
    phone: PHONE,
    password: PASSWORD,
    email_confirm: true,
    phone_confirm: true,
  });
  if (error) throw new Error(`createUser: ${error.message}`);
  return data.user;
}

async function fillProfile(userId) {
  // The handle_new_user trigger inserts the row on auth-user creation, but
  // upsert is safer in case this script ever runs against a row that already
  // exists with stale fields.
  const nowIso = new Date().toISOString();
  const update = {
    id: userId,
    email: EMAIL,
    display_name: DISPLAY_NAME,
    full_name: DISPLAY_NAME,
    phone: PHONE,
    phone_verified_at: nowIso,
    zip: ZIP,
    budget: 50000,
    credit_score: 720,
    no_credit: false,
    roles: ["admin", "buyer"],
    account_status: "active",
    preferences: { bestFit: "lowestTotal", notifChannels: ["in-app"] },
    onboarded_at: nowIso,
  };
  const { error } = await supabase
    .from("profiles")
    .upsert(update, { onConflict: "id" });
  if (error) throw new Error(`profile upsert: ${error.message}`);
}

async function main() {
  const user = await ensureUser();
  await fillProfile(user.id);

  console.log("\n✅ Dummy admin account ready.");
  console.log(`  user.id:  ${user.id}`);
  console.log(`  email:    ${EMAIL}`);
  console.log(`  phone:    ${PHONE}`);
  console.log(`  zip:      ${ZIP}`);
  console.log(`  role:     admin`);
  console.log(`  password: ${PASSWORD}`);

  console.log("\n👉 To sign in:");
  console.log("   1. npm run dev");
  console.log("   2. Visit http://localhost:3000/api/dev/admin-login");
  console.log(
    "      The route signs you in via signInWithPassword (server-side,",
  );
  console.log(
    "      which sets the cookie on localhost) and redirects to /admin.",
  );
  console.log(
    "      It is gated by NODE_ENV !== 'production' — never reachable in prod.",
  );
}

main().catch((err) => {
  console.error("\n❌ Failed to provision admin:", err.message);
  process.exit(1);
});
