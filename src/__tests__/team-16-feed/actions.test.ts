import { beforeEach, describe, expect, test, vi } from "vitest";
import { makeFixtureUser } from "@/contracts";

// In-memory bucket store so we can observe real service writes.
type Bucket = Map<string, unknown>;
const buckets = new Map<string, Bucket>();
const getBucket = (name: string): Bucket => {
  if (!buckets.has(name)) buckets.set(name, new Map());
  return buckets.get(name)!;
};

const hoisted = vi.hoisted(() => ({
  requireUser: vi.fn(),
  uploadUserListing: vi.fn(),
  emitNotification: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn((_path: string) => {
    throw new Error("__redirect__");
  }),
}));

vi.mock("@/services/team-01-auth", () => ({
  requireUser: (...a: unknown[]) => hoisted.requireUser(...a),
}));

vi.mock("@/services/team-03-supply", () => ({
  uploadUserListing: (...a: unknown[]) => hoisted.uploadUserListing(...a),
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

vi.mock("next/cache", () => ({
  revalidatePath: (...a: unknown[]) => hoisted.revalidatePath(...a),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => hoisted.redirect(path),
}));

import {
  submitFeedPost,
  submitFeedComment,
  submitVehicleUpload,
  togglePostLike,
} from "@/app/feed/actions";
import {
  FEED_POSTS_BUCKET,
  FEED_POSTS_INDEX_BUCKET,
  FEED_POSTS_BY_USER_BUCKET,
  FEED_INDEX_KEY,
  createFeedPost,
} from "@/services/team-16-feed";

const resetAll = () => {
  for (const b of buckets.values()) b.clear();
  hoisted.requireUser.mockReset();
  hoisted.uploadUserListing.mockReset();
  hoisted.emitNotification.mockReset();
  hoisted.emitNotification.mockImplementation(async () => []);
  hoisted.revalidatePath.mockReset();
};

beforeEach(() => {
  resetAll();
});

describe("submitFeedPost", () => {
  test("is gated by requireUser and writes through the service", async () => {
    hoisted.requireUser.mockResolvedValue(makeFixtureUser({ id: "u_1" }));
    const result = await submitFeedPost({
      kind: "deal",
      body: "new accord",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(hoisted.requireUser).toHaveBeenCalledTimes(1);
    expect(hoisted.revalidatePath).toHaveBeenCalledWith("/feed");
    // Id landed in the global index bucket via appendToList.
    expect(getBucket(FEED_POSTS_INDEX_BUCKET).get(FEED_INDEX_KEY)).toEqual([
      result.post.id,
    ]);
    // And in the per-user bucket keyed by the viewer id.
    expect(getBucket(FEED_POSTS_BY_USER_BUCKET).get("u_1")).toEqual([
      result.post.id,
    ]);
    // The row itself landed in feed_posts.
    expect(getBucket(FEED_POSTS_BUCKET).get(result.post.id)).toBeTruthy();
  });

  test("redirects anonymous viewers rather than writing", async () => {
    hoisted.requireUser.mockImplementation(() => hoisted.redirect("/login"));
    await expect(
      submitFeedPost({ kind: "deal", body: "hi" }),
    ).rejects.toThrow("__redirect__");
    expect(getBucket(FEED_POSTS_BUCKET).size).toBe(0);
  });

  test("rejects unknown kinds", async () => {
    hoisted.requireUser.mockResolvedValue(makeFixtureUser({ id: "u_1" }));
    const result = await submitFeedPost({
      kind: "not-a-kind",
      body: "hi",
    });
    expect(result.ok).toBe(false);
  });

  test("enforces server-side caps bypassed by the UI (body length, media shape, listing id, deal price)", async () => {
    hoisted.requireUser.mockResolvedValue(makeFixtureUser({ id: "u_1" }));

    // Body over 10KB is rejected server-side.
    const huge = "x".repeat(10_001);
    const r1 = await submitFeedPost({ kind: "question", body: huge });
    expect(r1).toMatchObject({ ok: false });

    // Non-data-URL media ref is rejected.
    const r2 = await submitFeedPost({
      kind: "question",
      body: "ok",
      mediaRefs: ["https://evil.example.com/image.png"],
    });
    expect(r2).toMatchObject({ ok: false });

    // Too many media refs.
    const tinyRef = "data:image/png;base64,AAA";
    const r3 = await submitFeedPost({
      kind: "question",
      body: "ok",
      mediaRefs: [tinyRef, tinyRef, tinyRef, tinyRef, tinyRef],
    });
    expect(r3).toMatchObject({ ok: false });

    // Malformed listing id.
    const r4 = await submitFeedPost({
      kind: "question",
      body: "ok",
      listingId: "../etc/passwd",
    });
    expect(r4).toMatchObject({ ok: false });

    // Negative deal price.
    const r5 = await submitFeedPost({
      kind: "deal",
      body: "ok",
      dealPrice: -1,
    });
    expect(r5).toMatchObject({ ok: false });

    // Nothing was written.
    expect(getBucket(FEED_POSTS_BUCKET).size).toBe(0);
  });
});

describe("togglePostLike", () => {
  test("likes then unlikes, both gated by requireUser", async () => {
    hoisted.requireUser.mockResolvedValue(makeFixtureUser({ id: "u_1" }));
    const post = await createFeedPost({
      authorId: "u_other",
      kind: "question",
      body: "help",
    });
    if (!post.ok) throw new Error("setup");

    const a = await togglePostLike({ postId: post.post.id, liked: false });
    expect(a).toMatchObject({ ok: true, liked: true, count: 1 });

    const b = await togglePostLike({ postId: post.post.id, liked: true });
    expect(b).toMatchObject({ ok: true, liked: false, count: 0 });
    expect(hoisted.requireUser).toHaveBeenCalledTimes(2);
  });
});

describe("submitFeedComment", () => {
  test("requires auth and fans out a notification to a different author", async () => {
    hoisted.requireUser.mockResolvedValue(makeFixtureUser({ id: "u_commenter" }));
    const post = await createFeedPost({
      authorId: "u_author",
      kind: "question",
      body: "help",
    });
    if (!post.ok) throw new Error("setup");

    const result = await submitFeedComment({
      postId: post.post.id,
      body: "try this",
    });
    expect(result.ok).toBe(true);
    expect(hoisted.emitNotification).toHaveBeenCalledTimes(1);
    const firstCall = hoisted.emitNotification.mock.calls[0];
    const firstArg = firstCall?.[0] as { userId: string; category: string };
    expect(firstArg).toMatchObject({
      userId: "u_author",
      category: "system",
    });
  });
});

describe("submitVehicleUpload", () => {
  test("delegates to Team 3 and optionally spawns a companion feed post", async () => {
    hoisted.requireUser.mockResolvedValue(makeFixtureUser({ id: "u_1" }));
    hoisted.uploadUserListing.mockResolvedValue({
      ok: true,
      listing: { id: "listing_42" },
    });

    const result = await submitVehicleUpload({
      year: 2019,
      make: "Honda",
      model: "Accord",
      titleStatus: "clean",
      photos: [],
      price: 18500,
      feedBody: "grabbed this one",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.listingId).toBe("listing_42");
    expect(result.postId).toBeTruthy();
    expect(hoisted.uploadUserListing).toHaveBeenCalledTimes(1);
    // Companion post got written.
    const ids = getBucket(FEED_POSTS_INDEX_BUCKET).get(
      FEED_INDEX_KEY,
    ) as string[];
    expect(ids).toContain(result.postId);
    expect(hoisted.revalidatePath).toHaveBeenCalledWith("/feed");
  });

  test("surfaces postWarning when the listing persists but the companion post fails server-side validation", async () => {
    hoisted.requireUser.mockResolvedValue(makeFixtureUser({ id: "u_1" }));
    hoisted.uploadUserListing.mockResolvedValue({
      ok: true,
      listing: { id: "listing_42" },
    });

    // Companion body exceeds the server-side post-body cap. The listing
    // still persists; the result exposes postWarning rather than silently
    // dropping the failure.
    const result = await submitVehicleUpload({
      year: 2019,
      make: "Honda",
      model: "Accord",
      titleStatus: "clean",
      photos: [],
      feedBody: "x".repeat(10_001),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.listingId).toBe("listing_42");
    expect(result.postId).toBeUndefined();
    expect(result.postWarning).toBeTruthy();
  });

  test("forwards Team 3 validation errors without writing a feed post", async () => {
    hoisted.requireUser.mockResolvedValue(makeFixtureUser({ id: "u_1" }));
    hoisted.uploadUserListing.mockResolvedValue({
      ok: false,
      reason: "Year must be between 1950 and 2100.",
      field: "year",
    });

    const result = await submitVehicleUpload({
      year: 1800,
      make: "Honda",
      model: "Accord",
      titleStatus: "clean",
      photos: [],
      feedBody: "would have been a great post",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/Year/);
    expect(getBucket(FEED_POSTS_BUCKET).size).toBe(0);
  });
});
