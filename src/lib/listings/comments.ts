import "server-only";
import {
  getRecord,
  listRecords,
  putRecord,
} from "@/services/team-15-storage";

export type ListingComment = {
  id: string;
  listingId: string;
  authorId: string;
  authorName: string;
  body: string;
  parentId: string | null;
  createdAt: string;
};

const BUCKET_PREFIX = "listing-comments";

const commentKey = (listingId: string, commentId: string) =>
  `${listingId}/${commentId}`;

const bucketForListing = (listingId: string): string =>
  `${BUCKET_PREFIX}:${listingId}`;

export const MAX_COMMENT_LEN = 2000;

export const validateCommentBody = (body: string): string | null => {
  const trimmed = body.trim();
  if (trimmed.length === 0) return "Comment cannot be empty.";
  if (trimmed.length > MAX_COMMENT_LEN) {
    return `Comment cannot exceed ${MAX_COMMENT_LEN} characters.`;
  }
  return null;
};

export const listComments = async (
  listingId: string,
): Promise<ListingComment[]> => {
  const all = await listRecords<ListingComment>(bucketForListing(listingId));
  return all
    .filter((c) => c.listingId === listingId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};

export const getComment = async (
  listingId: string,
  commentId: string,
): Promise<ListingComment | null> =>
  getRecord<ListingComment>(bucketForListing(listingId), commentKey(listingId, commentId));

export const addComment = async (input: {
  listingId: string;
  authorId: string;
  authorName: string;
  body: string;
  parentId?: string;
}): Promise<
  | { ok: true; comment: ListingComment }
  | { ok: false; error: string }
> => {
  const err = validateCommentBody(input.body);
  if (err) return { ok: false, error: err };

  if (input.parentId) {
    const parent = await getComment(input.listingId, input.parentId);
    if (!parent) return { ok: false, error: "Parent comment not found." };
    if (parent.parentId) {
      return { ok: false, error: "Replies are one level deep." };
    }
  }

  const id = `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const comment: ListingComment = {
    id,
    listingId: input.listingId,
    authorId: input.authorId,
    authorName: input.authorName,
    body: input.body.trim(),
    parentId: input.parentId ?? null,
    createdAt: new Date().toISOString(),
  };
  await putRecord(
    bucketForListing(input.listingId),
    commentKey(input.listingId, id),
    comment,
  );
  return { ok: true, comment };
};

