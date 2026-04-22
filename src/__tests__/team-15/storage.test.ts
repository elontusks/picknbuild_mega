import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

type TableStub = {
  upsert: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
};

const table: TableStub = {
  upsert: vi.fn(),
  select: vi.fn(),
  delete: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  maybeSingle: vi.fn(),
};

// All chainable methods return `table` so the builder form keeps threading.
table.select.mockReturnValue(table);
table.delete.mockReturnValue(table);
table.eq.mockReturnValue(table);
table.order.mockReturnValue(table);

const fromMock = vi.fn(() => table);

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: fromMock }),
}));

import {
  getRecord,
  getSponsorsForPath,
  listRecords,
  putRecord,
  removeRecord,
} from "@/services/team-15-storage";

beforeEach(() => {
  fromMock.mockClear();
  for (const fn of Object.values(table)) fn.mockClear();
  table.select.mockReturnValue(table);
  table.delete.mockReturnValue(table);
  table.eq.mockReturnValue(table);
  table.order.mockReturnValue(table);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("putRecord", () => {
  test("upserts the row keyed by (bucket, id) with jsonb value", async () => {
    table.upsert.mockResolvedValue({ error: null });

    await putRecord("comments", "c1", { body: "hi" });

    expect(fromMock).toHaveBeenCalledWith("secure_records");
    expect(table.upsert).toHaveBeenCalledWith(
      { bucket: "comments", id: "c1", value: { body: "hi" } },
      { onConflict: "bucket,id" },
    );
  });

  test("throws when Supabase returns an error", async () => {
    table.upsert.mockResolvedValue({ error: { message: "boom" } });

    await expect(putRecord("b", "id1", {})).rejects.toThrow(/boom/);
  });
});

describe("getRecord", () => {
  test("returns the row's value payload", async () => {
    table.maybeSingle.mockResolvedValue({
      data: { value: { saved: ["l1"] } },
      error: null,
    });

    const out = await getRecord<{ saved: string[] }>("garage", "u1");

    expect(fromMock).toHaveBeenCalledWith("secure_records");
    expect(table.select).toHaveBeenCalledWith("value");
    expect(table.eq).toHaveBeenNthCalledWith(1, "bucket", "garage");
    expect(table.eq).toHaveBeenNthCalledWith(2, "id", "u1");
    expect(out).toEqual({ saved: ["l1"] });
  });

  test("returns null when no row exists", async () => {
    table.maybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(getRecord("garage", "missing")).resolves.toBeNull();
  });

  test("throws when Supabase returns an error", async () => {
    table.maybeSingle.mockResolvedValue({ error: { message: "db down" } });

    await expect(getRecord("b", "id")).rejects.toThrow(/db down/);
  });
});

describe("listRecords", () => {
  test("returns values for every row in the bucket, newest first", async () => {
    table.order.mockResolvedValue({
      data: [{ value: { a: 1 } }, { value: { a: 2 } }],
      error: null,
    });

    const out = await listRecords<{ a: number }>("messages");

    expect(fromMock).toHaveBeenCalledWith("secure_records");
    expect(table.eq).toHaveBeenCalledWith("bucket", "messages");
    expect(table.order).toHaveBeenCalledWith("updated_at", {
      ascending: false,
    });
    expect(out).toEqual([{ a: 1 }, { a: 2 }]);
  });

  test("returns [] when the bucket is empty", async () => {
    table.order.mockResolvedValue({ data: null, error: null });

    await expect(listRecords("empty")).resolves.toEqual([]);
  });
});

describe("removeRecord", () => {
  test("deletes by (bucket, id)", async () => {
    // removeRecord awaits the chain directly after the second .eq; make the
    // final call resolve with { error: null }.
    table.eq
      .mockReset()
      .mockReturnValueOnce(table)
      .mockResolvedValueOnce({ error: null });

    await removeRecord("payments", "p1");

    expect(fromMock).toHaveBeenCalledWith("secure_records");
    expect(table.delete).toHaveBeenCalled();
    expect(table.eq).toHaveBeenNthCalledWith(1, "bucket", "payments");
    expect(table.eq).toHaveBeenNthCalledWith(2, "id", "p1");
  });

  test("throws when Supabase returns an error", async () => {
    table.eq
      .mockReset()
      .mockReturnValueOnce(table)
      .mockResolvedValueOnce({ error: { message: "nope" } });

    await expect(removeRecord("b", "id")).rejects.toThrow(/nope/);
  });
});

describe("getSponsorsForPath", () => {
  test("maps rows to SponsorBlock, attaching cta only when both parts present", async () => {
    table.order.mockResolvedValue({
      data: [
        {
          id: "sp1",
          path: "picknbuild",
          title: "Tier 1 partner",
          body_html: "<p>a</p>",
          cta_label: "Learn more",
          cta_href: "https://example.com",
        },
        {
          id: "sp2",
          path: "picknbuild",
          title: "No CTA",
          body_html: "<p>b</p>",
          cta_label: null,
          cta_href: null,
        },
      ],
      error: null,
    });

    const out = await getSponsorsForPath("picknbuild");

    expect(fromMock).toHaveBeenCalledWith("sponsor_blocks");
    expect(table.eq).toHaveBeenNthCalledWith(1, "path", "picknbuild");
    expect(table.eq).toHaveBeenNthCalledWith(2, "active", true);
    expect(table.order).toHaveBeenCalledWith("sort_order", {
      ascending: true,
    });
    expect(out).toEqual([
      {
        id: "sp1",
        path: "picknbuild",
        title: "Tier 1 partner",
        bodyHtml: "<p>a</p>",
        cta: { label: "Learn more", href: "https://example.com" },
      },
      {
        id: "sp2",
        path: "picknbuild",
        title: "No CTA",
        bodyHtml: "<p>b</p>",
      },
    ]);
  });

  test("returns [] when the path has no active sponsors", async () => {
    table.order.mockResolvedValue({ data: [], error: null });

    await expect(getSponsorsForPath("auction")).resolves.toEqual([]);
  });

  test("throws when Supabase returns an error", async () => {
    table.order.mockResolvedValue({ error: { message: "oops" } });

    await expect(getSponsorsForPath("dealer")).rejects.toThrow(/oops/);
  });
});
