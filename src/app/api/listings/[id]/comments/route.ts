import { NextResponse } from "next/server";
import { requireCap } from "@/lib/authz/server/require-cap";
import { CAPABILITIES as C } from "@/lib/authz/capabilities";
import { getListing } from "@/services/team-03-supply";
import { getCurrentUser } from "@/services/team-01-auth";
import { addComment, listComments } from "@/lib/listings/comments";

type Ctx = { params: Promise<{ id: string }> };

export const GET = requireCap<Ctx>(C.listings.view)(async (_req, ctx) => {
  const { id } = await ctx.params;
  const listing = await getListing(id);
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  const comments = await listComments(id);
  return NextResponse.json({ comments });
});

export const POST = requireCap<Ctx>(C.comments.create)(async (req, ctx) => {
  const { id } = await ctx.params;
  const listing = await getListing(id);
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    body?: string;
    parentId?: string;
  };
  if (typeof body.body !== "string") {
    return NextResponse.json({ error: "body required" }, { status: 400 });
  }
  const authorName = user.displayName ?? user.email ?? user.phone ?? "Buyer";
  const result = await addComment({
    listingId: id,
    authorId: user.id,
    authorName,
    body: body.body,
    ...(body.parentId ? { parentId: body.parentId } : {}),
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ comment: result.comment }, { status: 201 });
});
