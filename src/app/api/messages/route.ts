import { NextResponse } from "next/server";
import { requireCap } from "@/lib/authz/server/require-cap";
import { CAPABILITIES as C } from "@/lib/authz/capabilities";
import {
  getThread,
  listMessages,
  sendMessage,
} from "@/services/team-13-messaging";

export const GET = requireCap(C.messages.read)(async (req, _ctx, principal) => {
  const url = new URL(req.url);
  const threadId = url.searchParams.get("threadId");
  if (!threadId) {
    return NextResponse.json({ error: "threadId required" }, { status: 400 });
  }
  const thread = await getThread(threadId);
  if (!thread) {
    return NextResponse.json({ error: "thread not found" }, { status: 404 });
  }
  if (!thread.participants.includes(principal.id)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const limitRaw = url.searchParams.get("limit");
  const before = url.searchParams.get("before") ?? undefined;
  const limit = limitRaw ? Math.max(1, Math.min(200, Number(limitRaw))) : undefined;
  const messages = await listMessages(threadId, {
    ...(limit !== undefined ? { limit } : {}),
    ...(before !== undefined ? { before } : {}),
  });
  return NextResponse.json({ messages });
});

export const POST = requireCap(C.messages.send)(async (req, _ctx, principal) => {
  const body = (await req.json().catch(() => ({}))) as {
    threadId?: string;
    body?: string;
    attachments?: string[];
  };
  const { threadId } = body;
  if (!threadId || !body.body) {
    return NextResponse.json(
      { error: "threadId and body required" },
      { status: 400 },
    );
  }
  const thread = await getThread(threadId);
  if (!thread) {
    return NextResponse.json({ error: "thread not found" }, { status: 404 });
  }
  if (!thread.participants.includes(principal.id)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const message = await sendMessage({
    threadId,
    senderId: principal.id,
    body: body.body,
    ...(body.attachments !== undefined ? { attachments: body.attachments } : {}),
  });
  return NextResponse.json({ message });
});
