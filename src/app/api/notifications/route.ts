import { NextResponse } from "next/server";
import { requireCap } from "@/lib/authz/server/require-cap";
import { CAPABILITIES as C } from "@/lib/authz/capabilities";
import {
  countUnread,
  listNotifications,
  markAllAsRead,
} from "@/services/team-13-notifications";

// Notifications are authenticated-user data — the `messages.read` capability
// is the closest existing gate (inbox + bell read from the same principal).
export const GET = requireCap(C.messages.read)(async (req, _ctx, principal) => {
  const url = new URL(req.url);
  if (url.searchParams.get("unreadOnly") === "true") {
    const unread = await countUnread(principal.id);
    return NextResponse.json({ unread });
  }
  const notifications = await listNotifications(principal.id);
  return NextResponse.json({ notifications });
});

export const POST = requireCap(C.messages.read)(async (_req, _ctx, principal) => {
  const result = await markAllAsRead(principal.id);
  return NextResponse.json(result);
});
