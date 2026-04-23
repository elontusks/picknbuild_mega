import { beforeEach, describe, expect, test, vi } from "vitest";

// In-memory bucket store so we can observe service writes without
// touching Supabase. Mirrors the pattern in
// src/__tests__/team-10/actions.test.ts.
type Bucket = Map<string, unknown>;
const buckets = new Map<string, Bucket>();
const getBucket = (name: string): Bucket => {
  if (!buckets.has(name)) buckets.set(name, new Map());
  return buckets.get(name)!;
};

const hoisted = vi.hoisted(() => ({
  emitNotification: vi.fn(),
}));

vi.mock("@/services/team-13-notifications", () => ({
  emitNotification: (...a: unknown[]) => hoisted.emitNotification(...a),
}));

vi.mock("@/services/team-15-storage", () => ({
  putRecord: vi.fn(async (bucket: string, id: string, value: unknown) => {
    getBucket(bucket).set(id, value);
  }),
  getRecord: vi.fn(async (bucket: string, id: string) =>
    getBucket(bucket).get(id) ?? null,
  ),
  listRecords: vi.fn(async (bucket: string) =>
    Array.from(getBucket(bucket).values()),
  ),
  removeRecord: vi.fn(async (bucket: string, id: string) => {
    getBucket(bucket).delete(id);
  }),
  appendToList: vi.fn(async (bucket: string, id: string, value: unknown) => {
    const b = getBucket(bucket);
    const existing = (b.get(id) as unknown[] | undefined) ?? [];
    b.set(id, [...existing, value]);
  }),
}));

import {
  FEED_POSTS_BUCKET,
  FEED_POSTS_INDEX_BUCKET,
  FEED_POSTS_BY_USER_BUCKET,
  FEED_INDEX_KEY,
  FEED_LIKES_BUCKET,
  FEED_COMMENTS_BUCKET,
  addComment,
  countFeedPosts,
  createFeedPost,
  getFeedPost,
  likePost,
  listFeedPosts,
  unlikePost,
} from "@/services/team-16-feed";
import type { FeedPost } from "@/lib/feed/types";

const resetAll = () => {
  for (const b of buckets.values()) b.clear();
  hoisted.emitNotification.mockReset();
  hoisted.emitNotification.mockImplementation(async () => []);
};

beforeEach(() => {
  resetAll();
});

describe("createFeedPost", () => {
  test("persists the post and appends its id to both indices via appendToList", async () => {
    const result = await createFeedPost({
      authorId: "u_1",
      kind: "deal",
      body: "Just grabbed this Accord for $18k",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // Row written to feed_posts
    const stored = getBucket(FEED_POSTS_BUCKET).get(result.post.id) as FeedPost;
    expect(stored).toBeTruthy();
    expect(stored.authorId).toBe("u_1");
    expect(stored.kind).toBe("deal");

    // Global index appended
    expect(getBucket(FEED_POSTS_INDEX_BUCKET).get(FEED_INDEX_KEY)).toEqual([
      result.post.id,
    ]);
    // Per-user index appended
    expect(getBucket(FEED_POSTS_BY_USER_BUCKET).get("u_1")).toEqual([
      result.post.id,
    ]);
  });

  test("rejects empty body", async () => {
    const result = await createFeedPost({
      authorId: "u_1",
      kind: "question",
      body: "   ",
    });
    expect(result.ok).toBe(false);
    expect(getBucket(FEED_POSTS_BUCKET).size).toBe(0);
  });

  test("carries optional listingId, media, and per-kind extras", async () => {
    const result = await createFeedPost({
      authorId: "u_1",
      kind: "warning",
      body: "careful",
      listingId: "listing_0001",
      mediaRefs: ["data:image/png;base64,AAA"],
      extras: { warningSeverity: "high" },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.post.listingId).toBe("listing_0001");
    expect(result.post.mediaRefs).toEqual(["data:image/png;base64,AAA"]);
    expect(result.post.extras?.warningSeverity).toBe("high");
  });
});

describe("listFeedPosts / countFeedPosts", () => {
  test("returns posts sorted newest-first via clustering stub", async () => {
    const first = await createFeedPost({
      authorId: "u_1",
      kind: "question",
      body: "older",
    });
    await new Promise((r) => setTimeout(r, 5));
    const second = await createFeedPost({
      authorId: "u_2",
      kind: "question",
      body: "newer",
    });
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    const all = await listFeedPosts();
    expect(all.map((p) => p.id)).toEqual([second.post.id, first.post.id]);
  });

  test("countFeedPosts returns the bucket size (what the admin tile consumes)", async () => {
    expect(await countFeedPosts()).toBe(0);
    await createFeedPost({ authorId: "u_1", kind: "deal", body: "a" });
    await createFeedPost({ authorId: "u_1", kind: "deal", body: "b" });
    expect(await countFeedPosts()).toBe(2);
  });

  test("getFeedPost returns null when the id is unknown", async () => {
    expect(await getFeedPost("fp_missing")).toBeNull();
  });
});

describe("likePost / unlikePost", () => {
  test("likePost is idempotent — same user liking twice does not double-count", async () => {
    const post = await createFeedPost({
      authorId: "u_1",
      kind: "question",
      body: "hi",
    });
    if (!post.ok) throw new Error("setup");
    const first = await likePost({ postId: post.post.id, userId: "u_2" });
    const second = await likePost({ postId: post.post.id, userId: "u_2" });
    expect(first.count).toBe(1);
    expect(second.count).toBe(1);
    // Distinct users tally up.
    const third = await likePost({ postId: post.post.id, userId: "u_3" });
    expect(third.count).toBe(2);
    expect(getBucket(FEED_LIKES_BUCKET).get(post.post.id)).toEqual({
      u_2: true,
      u_3: true,
    });
  });

  test("unlikePost removes the user from the like map", async () => {
    const post = await createFeedPost({
      authorId: "u_1",
      kind: "deal",
      body: "x",
    });
    if (!post.ok) throw new Error("setup");
    await likePost({ postId: post.post.id, userId: "u_2" });
    const result = await unlikePost({
      postId: post.post.id,
      userId: "u_2",
    });
    expect(result).toEqual({ ok: true, liked: false, count: 0 });
  });
});

describe("addComment", () => {
  test("persists the comment and fans out a Team 13 notification to the post author", async () => {
    const post = await createFeedPost({
      authorId: "u_author",
      kind: "question",
      body: "help",
    });
    if (!post.ok) throw new Error("setup");

    const result = await addComment({
      postId: post.post.id,
      userId: "u_commenter",
      body: "try this",
    });
    expect(result.ok).toBe(true);

    const stored = getBucket(FEED_COMMENTS_BUCKET).get(post.post.id) as Array<{
      userId: string;
      body: string;
    }>;
    expect(stored).toHaveLength(1);
    expect(stored[0]!.body).toBe("try this");

    expect(hoisted.emitNotification).toHaveBeenCalledTimes(1);
    const firstCall = hoisted.emitNotification.mock.calls[0];
    const firstArg = firstCall?.[0] as { userId: string; category: string };
    expect(firstArg).toMatchObject({
      userId: "u_author",
      category: "system",
    });
  });

  test("does not fan out a notification when the author comments on their own post", async () => {
    const post = await createFeedPost({
      authorId: "u_author",
      kind: "question",
      body: "help",
    });
    if (!post.ok) throw new Error("setup");

    const result = await addComment({
      postId: post.post.id,
      userId: "u_author",
      body: "self reply",
    });
    expect(result.ok).toBe(true);
    expect(hoisted.emitNotification).not.toHaveBeenCalled();
  });

  test("rejects empty body and missing post", async () => {
    expect(
      await addComment({ postId: "fp_none", userId: "u_1", body: "hi" }),
    ).toMatchObject({ ok: false, error: "Post not found." });

    const post = await createFeedPost({
      authorId: "u_1",
      kind: "deal",
      body: "x",
    });
    if (!post.ok) throw new Error("setup");
    expect(
      await addComment({
        postId: post.post.id,
        userId: "u_2",
        body: "   ",
      }),
    ).toMatchObject({ ok: false });
  });
});
