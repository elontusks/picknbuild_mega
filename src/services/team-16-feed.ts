import "server-only";

import { nowIso } from "@/contracts";
import * as Storage from "./team-15-storage";
import { emitNotification } from "./team-13-notifications";
import {
  FEED_POST_KINDS,
  isFeedPostKind,
  type FeedComment,
  type FeedPost,
  type FeedPostKind,
} from "@/lib/feed/types";
import { clusterFeedPosts } from "@/lib/feed/cluster";

// Team 16 — feed read/write service.
//
// Persists through Team 15's secure storage. Buckets:
//   feed_posts          → FeedPost, keyed by post id
//   feed_posts_index    → string[] of post ids (global, keyed by "all") — the
//                         main feed index. Uses appendToList to avoid the
//                         read-modify-write race Team 13 flagged on its own
//                         index buckets.
//   feed_posts_by_user  → string[] of post ids, keyed by authorId. Also
//                         appendToList-based so dashboards can list a user's
//                         own posts without scanning the global bucket.
//   feed_likes          → { [userId: string]: true } map, keyed by post id.
//   feed_comments       → FeedComment[], keyed by post id.

export const FEED_POSTS_BUCKET = "feed_posts";
export const FEED_POSTS_INDEX_BUCKET = "feed_posts_index";
export const FEED_POSTS_BY_USER_BUCKET = "feed_posts_by_user";
export const FEED_LIKES_BUCKET = "feed_likes";
export const FEED_COMMENTS_BUCKET = "feed_comments";
export const FEED_INDEX_KEY = "all";

const newId = (prefix: string): string => {
  const rand =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${rand}`;
};

// ---- reads -----------------------------------------------------------------

export const listFeedPosts = async (): Promise<FeedPost[]> => {
  const ids =
    (await Storage.getRecord<string[]>(
      FEED_POSTS_INDEX_BUCKET,
      FEED_INDEX_KEY,
    )) ?? [];
  if (ids.length === 0) return [];
  const records = await Promise.all(
    ids.map((id) => Storage.getRecord<FeedPost>(FEED_POSTS_BUCKET, id)),
  );
  const posts = records.filter((p): p is FeedPost => p !== null);
  return clusterFeedPosts(posts);
};

export const getFeedPost = async (id: string): Promise<FeedPost | null> =>
  Storage.getRecord<FeedPost>(FEED_POSTS_BUCKET, id);

export const listFeedPostsForUser = async (
  authorId: string,
): Promise<FeedPost[]> => {
  const ids =
    (await Storage.getRecord<string[]>(
      FEED_POSTS_BY_USER_BUCKET,
      authorId,
    )) ?? [];
  if (ids.length === 0) return [];
  const records = await Promise.all(
    ids.map((id) => Storage.getRecord<FeedPost>(FEED_POSTS_BUCKET, id)),
  );
  return records
    .filter((p): p is FeedPost => p !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

// Admin-tile friendly: how many posts exist. The admin tile calls this.
export const countFeedPosts = async (): Promise<number> => {
  const ids =
    (await Storage.getRecord<string[]>(
      FEED_POSTS_INDEX_BUCKET,
      FEED_INDEX_KEY,
    )) ?? [];
  return ids.length;
};

// ---- create ----------------------------------------------------------------

export type CreateFeedPostInput = {
  authorId: string;
  kind: FeedPostKind;
  body: string;
  listingId?: string;
  mediaRefs?: string[];
  extras?: FeedPost["extras"];
};

export type CreateFeedPostResult =
  | { ok: true; post: FeedPost }
  | { ok: false; error: string };

export const createFeedPost = async (
  input: CreateFeedPostInput,
): Promise<CreateFeedPostResult> => {
  const body = input.body?.trim() ?? "";
  if (body.length < 1) {
    return { ok: false, error: "Post body cannot be empty." };
  }
  if (!isFeedPostKind(input.kind)) {
    return {
      ok: false,
      error: `Unknown post kind. Expected one of ${FEED_POST_KINDS.join(", ")}.`,
    };
  }
  const post: FeedPost = {
    id: newId("fp"),
    authorId: input.authorId,
    kind: input.kind,
    body,
    createdAt: nowIso(),
    ...(input.listingId ? { listingId: input.listingId } : {}),
    ...(input.mediaRefs && input.mediaRefs.length > 0
      ? { mediaRefs: input.mediaRefs }
      : {}),
    ...(input.extras ? { extras: input.extras } : {}),
  };

  await Storage.putRecord(FEED_POSTS_BUCKET, post.id, post);
  // Atomic append for both indices — avoid the RMW race Team 13 flagged.
  await Promise.all([
    Storage.appendToList(FEED_POSTS_INDEX_BUCKET, FEED_INDEX_KEY, post.id),
    Storage.appendToList(FEED_POSTS_BY_USER_BUCKET, post.authorId, post.id),
  ]);

  return { ok: true, post };
};

// ---- likes -----------------------------------------------------------------

type LikeMap = Record<string, true>;

export const likePost = async (input: {
  postId: string;
  userId: string;
}): Promise<{ ok: true; liked: boolean; count: number }> => {
  const existing =
    (await Storage.getRecord<LikeMap>(FEED_LIKES_BUCKET, input.postId)) ?? {};
  if (existing[input.userId]) {
    return {
      ok: true,
      liked: true,
      count: Object.keys(existing).length,
    };
  }
  const next: LikeMap = { ...existing, [input.userId]: true };
  await Storage.putRecord(FEED_LIKES_BUCKET, input.postId, next);
  return { ok: true, liked: true, count: Object.keys(next).length };
};

export const unlikePost = async (input: {
  postId: string;
  userId: string;
}): Promise<{ ok: true; liked: boolean; count: number }> => {
  const existing =
    (await Storage.getRecord<LikeMap>(FEED_LIKES_BUCKET, input.postId)) ?? {};
  if (!existing[input.userId]) {
    return {
      ok: true,
      liked: false,
      count: Object.keys(existing).length,
    };
  }
  const next: LikeMap = { ...existing };
  delete next[input.userId];
  await Storage.putRecord(FEED_LIKES_BUCKET, input.postId, next);
  return { ok: true, liked: false, count: Object.keys(next).length };
};

export const countLikes = async (postId: string): Promise<number> => {
  const existing =
    (await Storage.getRecord<LikeMap>(FEED_LIKES_BUCKET, postId)) ?? {};
  return Object.keys(existing).length;
};

export const hasLiked = async (input: {
  postId: string;
  userId: string;
}): Promise<boolean> => {
  const existing =
    (await Storage.getRecord<LikeMap>(FEED_LIKES_BUCKET, input.postId)) ?? {};
  return existing[input.userId] === true;
};

// ---- comments --------------------------------------------------------------

export type AddCommentResult =
  | { ok: true; comment: FeedComment }
  | { ok: false; error: string };

export const addComment = async (input: {
  postId: string;
  userId: string;
  body: string;
}): Promise<AddCommentResult> => {
  const body = input.body?.trim() ?? "";
  if (body.length < 1) {
    return { ok: false, error: "Comment cannot be empty." };
  }
  const post = await Storage.getRecord<FeedPost>(
    FEED_POSTS_BUCKET,
    input.postId,
  );
  if (!post) return { ok: false, error: "Post not found." };

  const comment: FeedComment = {
    id: newId("fc"),
    postId: input.postId,
    userId: input.userId,
    body,
    createdAt: nowIso(),
  };
  const existing =
    (await Storage.getRecord<FeedComment[]>(
      FEED_COMMENTS_BUCKET,
      input.postId,
    )) ?? [];
  await Storage.putRecord(FEED_COMMENTS_BUCKET, input.postId, [
    ...existing,
    comment,
  ]);

  // Fan-out notification to the post author — but not if they're commenting
  // on their own post. Fire-and-forget; emitNotification swallows errors.
  if (post.authorId !== input.userId) {
    await emitNotification({
      userId: post.authorId,
      category: "system",
      payload: {
        title: "New comment on your post",
        postId: post.id,
        commentId: comment.id,
        commenterId: input.userId,
      },
    });
  }

  return { ok: true, comment };
};

export const listComments = async (postId: string): Promise<FeedComment[]> => {
  const rows =
    (await Storage.getRecord<FeedComment[]>(FEED_COMMENTS_BUCKET, postId)) ??
    [];
  return [...rows].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};
