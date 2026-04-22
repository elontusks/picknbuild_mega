import { describe, expect, test } from "vitest";
import {
  buildChecklist,
  setChecklistItem,
} from "@/lib/pricing/checklist";

describe("buildChecklist", () => {
  test("produces items with unique ids tied to path + listing", () => {
    const items = buildChecklist({
      path: "picknbuild",
      listingId: "L1",
      userId: "u1",
    });
    const ids = items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.includes("L1"))).toBe(true);
  });

  test("includes path-specific critical items for auction", () => {
    const items = buildChecklist({
      path: "auction",
      listingId: "L1",
      userId: "u1",
    });
    const critical = items.filter((i) => i.critical);
    expect(critical.length).toBeGreaterThanOrEqual(2);
    expect(critical.some((i) => /transport/i.test(i.label))).toBe(true);
  });

  test("different paths produce different label sets", () => {
    const picknbuild = buildChecklist({
      path: "picknbuild",
      listingId: "L1",
      userId: "u1",
    });
    const dealer = buildChecklist({
      path: "dealer",
      listingId: "L1",
      userId: "u1",
    });
    const labelsA = new Set(picknbuild.map((i) => i.label));
    const labelsB = new Set(dealer.map((i) => i.label));
    expect(labelsA).not.toEqual(labelsB);
  });
});

describe("setChecklistItem", () => {
  test("toggles only the matching item", () => {
    const items = buildChecklist({
      path: "dealer",
      listingId: "L1",
      userId: "u1",
    });
    const target = items[0]!;
    const updated = setChecklistItem(items, target.id, true);
    expect(updated.find((i) => i.id === target.id)?.completed).toBe(true);
    expect(updated.filter((i) => i.id !== target.id)).toEqual(
      items.filter((i) => i.id !== target.id),
    );
  });

  test("unknown id is a no-op", () => {
    const items = buildChecklist({
      path: "dealer",
      listingId: "L1",
      userId: "u1",
    });
    const updated = setChecklistItem(items, "does-not-exist", true);
    expect(updated).toEqual(items);
  });
});
