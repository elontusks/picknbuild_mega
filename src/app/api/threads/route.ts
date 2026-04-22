import { NextResponse } from "next/server";
import { requireCap } from "@/lib/authz/server/require-cap";
import { CAPABILITIES as C } from "@/lib/authz/capabilities";
import { listThreads } from "@/services/team-13-messaging";

export const GET = requireCap(C.messages.read)(async (_req, _ctx, principal) => {
  const threads = await listThreads(principal.id);
  return NextResponse.json({ threads });
});
