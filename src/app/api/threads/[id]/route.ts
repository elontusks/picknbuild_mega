import { NextResponse } from "next/server";
import { requireCap } from "@/lib/authz/server/require-cap";
import { CAPABILITIES as C } from "@/lib/authz/capabilities";
import { getThread } from "@/services/team-13-messaging";

type Ctx = { params: Promise<{ id: string }> };

export const GET = requireCap<Ctx>(C.messages.read)(async (_req, ctx, principal) => {
  const { id } = await ctx.params;
  const thread = await getThread(id);
  if (!thread) {
    return NextResponse.json({ error: "thread not found" }, { status: 404 });
  }
  if (!thread.participants.includes(principal.id)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return NextResponse.json({ thread });
});
