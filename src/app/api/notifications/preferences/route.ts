import { NextResponse } from "next/server";
import { requireCap } from "@/lib/authz/server/require-cap";
import { CAPABILITIES as C } from "@/lib/authz/capabilities";
import {
  getPreferences,
  updatePreferences,
  type NotificationPreferences,
} from "@/services/team-13-notifications";

export const GET = requireCap(C.messages.read)(async (_req, _ctx, principal) => {
  const prefs = await getPreferences(principal.id);
  return NextResponse.json({ preferences: prefs });
});

export const PUT = requireCap(C.messages.read)(async (req, _ctx, principal) => {
  const body = (await req.json().catch(() => null)) as
    | Partial<NotificationPreferences>
    | null;
  if (!body || !body.channels || !body.categories) {
    return NextResponse.json(
      { error: "channels and categories required" },
      { status: 400 },
    );
  }
  const current = await getPreferences(principal.id);
  const next: NotificationPreferences = {
    ...current,
    userId: principal.id,
    channels: body.channels,
    categories: body.categories,
    ...(body.email !== undefined ? { email: body.email } : {}),
  };
  const saved = await updatePreferences(next);
  return NextResponse.json({ preferences: saved });
});
