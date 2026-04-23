import { beforeEach, describe, expect, test, vi } from "vitest";
import { makeFixtureListingObject } from "@/contracts";

const hoisted = vi.hoisted(() => {
  const mem = new Map<string, unknown>();
  const key = (bucket: string, id: string) => `${bucket}:${id}`;
  return {
    mem,
    getRecord: vi.fn(async (bucket: string, id: string) => mem.get(key(bucket, id)) ?? null),
    putRecord: vi.fn(async (bucket: string, id: string, value: unknown) => {
      mem.set(key(bucket, id), value);
    }),
    removeRecord: vi.fn(async (bucket: string, id: string) => {
      mem.delete(key(bucket, id));
    }),
    listRecords: vi.fn(async () => []),
  };
});

vi.mock("@/services/team-15-storage", () => ({
  getRecord: hoisted.getRecord,
  putRecord: hoisted.putRecord,
  removeRecord: hoisted.removeRecord,
  listRecords: hoisted.listRecords,
}));

import {
  GARAGE_BUCKET,
  GARAGE_INDEX_BUCKET,
  listGarageItems,
  removeGarageItem,
  saveGarageItem,
  setGarageDecision,
  makeGroupKey,
} from "@/lib/garage/store";

describe("garage store", () => {
  beforeEach(() => {
    hoisted.mem.clear();
    hoisted.getRecord.mockClear();
    hoisted.putRecord.mockClear();
    hoisted.removeRecord.mockClear();
  });

  test("saveGarageItem writes the item and indexes it under the user", async () => {
    const listing = makeFixtureListingObject({
      id: "l_1",
      year: 2020,
      make: "Toyota",
      model: "Tacoma",
    });
    const item = await saveGarageItem({ userId: "u_1", listing });

    expect(item.userId).toBe("u_1");
    expect(item.listingId).toBe("l_1");
    expect(item.groupKey).toBe("2020-toyota-tacoma");
    expect(item.decision).toBeNull();

    expect(hoisted.putRecord).toHaveBeenCalledWith(
      GARAGE_BUCKET,
      "u_1:l_1",
      expect.objectContaining({ userId: "u_1", listingId: "l_1" }),
    );
    expect(hoisted.putRecord).toHaveBeenCalledWith(
      GARAGE_INDEX_BUCKET,
      "u_1",
      ["l_1"],
    );
  });

  test("saving the same listing twice doesn't duplicate the index entry", async () => {
    const listing = makeFixtureListingObject({ id: "l_1" });
    await saveGarageItem({ userId: "u_1", listing });
    await saveGarageItem({ userId: "u_1", listing });

    const ids = hoisted.mem.get(`${GARAGE_INDEX_BUCKET}:u_1`);
    expect(ids).toEqual(["l_1"]);
  });

  test("saveGarageItem updates decision on an existing record without reshuffling the index", async () => {
    const listing = makeFixtureListingObject({ id: "l_1" });
    await saveGarageItem({ userId: "u_1", listing });
    const updated = await saveGarageItem({
      userId: "u_1",
      listing,
      decision: "pick",
    });

    expect(updated.decision).toBe("pick");
    expect(hoisted.mem.get(`${GARAGE_INDEX_BUCKET}:u_1`)).toEqual(["l_1"]);
  });

  test("setGarageDecision flips the persisted decision", async () => {
    const listing = makeFixtureListingObject({ id: "l_1" });
    await saveGarageItem({ userId: "u_1", listing });
    hoisted.putRecord.mockClear();

    const updated = await setGarageDecision({
      userId: "u_1",
      listingId: "l_1",
      decision: "pick",
    });

    expect(updated?.decision).toBe("pick");
    expect(hoisted.putRecord).toHaveBeenCalledWith(
      GARAGE_BUCKET,
      "u_1:l_1",
      expect.objectContaining({ decision: "pick" }),
    );
  });

  test("setGarageDecision returns null when the listing was never saved", async () => {
    const result = await setGarageDecision({
      userId: "u_1",
      listingId: "l_missing",
      decision: "pick",
    });
    expect(result).toBeNull();
  });

  test("removeGarageItem deletes the record and removes from the index", async () => {
    const a = makeFixtureListingObject({ id: "l_1" });
    const b = makeFixtureListingObject({ id: "l_2" });
    await saveGarageItem({ userId: "u_1", listing: a });
    await saveGarageItem({ userId: "u_1", listing: b });

    await removeGarageItem("u_1", "l_1");

    expect(hoisted.mem.get(`${GARAGE_BUCKET}:u_1:l_1`)).toBeUndefined();
    expect(hoisted.mem.get(`${GARAGE_INDEX_BUCKET}:u_1`)).toEqual(["l_2"]);
  });

  test("listGarageItems returns saved items sorted newest-first", async () => {
    const a = makeFixtureListingObject({ id: "l_1" });
    const b = makeFixtureListingObject({ id: "l_2" });
    await saveGarageItem({ userId: "u_1", listing: a });
    // Nudge the timestamp on b so sort order is deterministic.
    await new Promise((r) => setTimeout(r, 5));
    await saveGarageItem({ userId: "u_1", listing: b });

    const items = await listGarageItems("u_1");
    expect(items.map((i) => i.listingId)).toEqual(["l_2", "l_1"]);
  });

  test("makeGroupKey lowercases year-make-model", () => {
    expect(
      makeGroupKey({ year: 2021, make: "Honda", model: "Accord" }),
    ).toBe("2021-honda-accord");
  });
});
