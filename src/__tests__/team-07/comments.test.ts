import { beforeEach, describe, expect, test, vi } from "vitest";

// Back the Team 15 storage layer with an in-memory map so comments persistence
// exercises the real bucket/key logic without hitting Supabase.
type Row = { value: unknown; updatedAt: number };
const store = new Map<string, Map<string, Row>>();

const bucketMap = (bucket: string): Map<string, Row> => {
  const existing = store.get(bucket);
  if (existing) return existing;
  const fresh = new Map<string, Row>();
  store.set(bucket, fresh);
  return fresh;
};

vi.mock("@/services/team-15-storage", () => ({
  putRecord: async (bucket: string, id: string, value: unknown) => {
    bucketMap(bucket).set(id, { value, updatedAt: Date.now() });
  },
  getRecord: async (bucket: string, id: string) => {
    return bucketMap(bucket).get(id)?.value ?? null;
  },
  listRecords: async (bucket: string) => {
    const rows = [...bucketMap(bucket).values()];
    rows.sort((a, b) => b.updatedAt - a.updatedAt);
    return rows.map((r) => r.value);
  },
  removeRecord: async (bucket: string, id: string) => {
    bucketMap(bucket).delete(id);
  },
}));

import {
  addComment,
  listComments,
  validateCommentBody,
  MAX_COMMENT_LEN,
} from "@/lib/listings/comments";

beforeEach(() => {
  store.clear();
});

describe("validateCommentBody", () => {
  test("rejects empty body", () => {
    expect(validateCommentBody("")).toBeTruthy();
    expect(validateCommentBody("   ")).toBeTruthy();
  });

  test("rejects body over MAX_COMMENT_LEN", () => {
    const long = "x".repeat(MAX_COMMENT_LEN + 1);
    expect(validateCommentBody(long)).toBeTruthy();
  });

  test("accepts normal body", () => {
    expect(validateCommentBody("hi")).toBeNull();
  });
});

describe("addComment + listComments — persistence via Team 15 storage", () => {
  test("persists a top-level comment and reads it back", async () => {
    const added = await addComment({
      listingId: "l1",
      authorId: "u1",
      authorName: "Jane",
      body: "great car!",
    });
    expect(added.ok).toBe(true);

    const list = await listComments("l1");
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      listingId: "l1",
      authorId: "u1",
      authorName: "Jane",
      body: "great car!",
      parentId: null,
    });
  });

  test("trims whitespace on save", async () => {
    const added = await addComment({
      listingId: "l1",
      authorId: "u1",
      authorName: "Jane",
      body: "  hello  ",
    });
    expect(added.ok).toBe(true);
    if (added.ok) expect(added.comment.body).toBe("hello");
  });

  test("rejects empty body without writing", async () => {
    const result = await addComment({
      listingId: "l1",
      authorId: "u1",
      authorName: "Jane",
      body: "",
    });
    expect(result.ok).toBe(false);
    expect(await listComments("l1")).toHaveLength(0);
  });

  test("reply attaches parentId and is visible under parent on read", async () => {
    const top = await addComment({
      listingId: "l1",
      authorId: "u1",
      authorName: "Jane",
      body: "first",
    });
    expect(top.ok).toBe(true);
    if (!top.ok) return;

    const reply = await addComment({
      listingId: "l1",
      authorId: "u2",
      authorName: "Bob",
      body: "reply body",
      parentId: top.comment.id,
    });
    expect(reply.ok).toBe(true);

    const list = await listComments("l1");
    expect(list).toHaveLength(2);
    const replies = list.filter((c) => c.parentId === top.comment.id);
    expect(replies).toHaveLength(1);
    expect(replies[0]?.body).toBe("reply body");
  });

  test("rejects reply to missing parent", async () => {
    const result = await addComment({
      listingId: "l1",
      authorId: "u1",
      authorName: "Jane",
      body: "reply",
      parentId: "cmt_does_not_exist",
    });
    expect(result.ok).toBe(false);
  });

  test("prevents nesting deeper than one level", async () => {
    const top = await addComment({
      listingId: "l1",
      authorId: "u1",
      authorName: "Jane",
      body: "top",
    });
    expect(top.ok).toBe(true);
    if (!top.ok) return;

    const reply = await addComment({
      listingId: "l1",
      authorId: "u2",
      authorName: "Bob",
      body: "reply",
      parentId: top.comment.id,
    });
    expect(reply.ok).toBe(true);
    if (!reply.ok) return;

    const nested = await addComment({
      listingId: "l1",
      authorId: "u3",
      authorName: "Eve",
      body: "nested",
      parentId: reply.comment.id,
    });
    expect(nested.ok).toBe(false);
  });

  test("isolates comments between listings (bucket keyed by listingId)", async () => {
    await addComment({
      listingId: "l1",
      authorId: "u1",
      authorName: "Jane",
      body: "on l1",
    });
    await addComment({
      listingId: "l2",
      authorId: "u2",
      authorName: "Bob",
      body: "on l2",
    });

    const l1 = await listComments("l1");
    const l2 = await listComments("l2");
    expect(l1).toHaveLength(1);
    expect(l2).toHaveLength(1);
    expect(l1[0]?.listingId).toBe("l1");
    expect(l2[0]?.listingId).toBe("l2");
  });

  test("listComments orders ascending by createdAt", async () => {
    const first = await addComment({
      listingId: "l3",
      authorId: "u1",
      authorName: "Jane",
      body: "first",
    });
    await new Promise((r) => setTimeout(r, 5));
    const second = await addComment({
      listingId: "l3",
      authorId: "u2",
      authorName: "Bob",
      body: "second",
    });
    expect(first.ok && second.ok).toBe(true);

    const list = await listComments("l3");
    expect(list.map((c) => c.body)).toEqual(["first", "second"]);
  });
});
