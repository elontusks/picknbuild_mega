import { NextResponse } from "next/server";
import { requireCap } from "@/lib/authz/server/require-cap";
import { CAPABILITIES as C } from "@/lib/authz/capabilities";
import { markAsRead } from "@/services/team-13-notifications";

type Ctx = { params: Promise<{ id: string }> };

export const POST = requireCap<Ctx>(C.messages.read)(async (_req, ctx, principal) => {
  const { id } = await ctx.params;
  const result = await markAsRead({ userId: principal.id, notificationId: id });
  return NextResponse.json(result);
});
