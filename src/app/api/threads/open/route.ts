import { NextResponse } from "next/server";
import { requireCap } from "@/lib/authz/server/require-cap";
import { CAPABILITIES as C } from "@/lib/authz/capabilities";
import { openOrCreateThread } from "@/services/team-13-messaging";
import type { ThreadKind } from "@/contracts";

const KINDS: readonly ThreadKind[] = [
  "buyer-seller",
  "buyer-dealer",
  "buyer-picknbuild",
];

export const POST = requireCap(C.messages.send)(async (req, _ctx, principal) => {
  const body = (await req.json().catch(() => ({}))) as {
    kind?: ThreadKind;
    listingId?: string;
    otherParticipantId?: string;
  };
  const { kind, listingId, otherParticipantId } = body;
  if (!kind || !KINDS.includes(kind)) {
    return NextResponse.json({ error: "invalid kind" }, { status: 400 });
  }
  const participants = [principal.id];
  if (otherParticipantId) participants.push(otherParticipantId);
  const thread = await openOrCreateThread({
    kind,
    listingId,
    participants,
  });
  return NextResponse.json({ thread });
});
