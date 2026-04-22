import { NextResponse } from "next/server";
import { requireCap } from "@/lib/authz/server/require-cap";
import { CAPABILITIES as C } from "@/lib/authz/capabilities";
import { sendDigest } from "@/services/team-13-notifications";

// On-demand digest trigger. Production deployments schedule this per-user
// via an external cron — we expose it as a route so the Preferences Panel
// can offer a "send test digest" action and so ops can fire one by hand
// without shelling into the server.
export const POST = requireCap(C.messages.read)(async (req, _ctx, principal) => {
  const body = (await req.json().catch(() => ({}))) as { since?: string };
  const result = await sendDigest({
    userId: principal.id,
    ...(body.since !== undefined ? { since: body.since } : {}),
  });
  return NextResponse.json(result);
});
