import { describe, expect, test } from "vitest";
import {
  makeFixtureIntakeState,
  makeFixtureListingObject,
} from "@/contracts";
import { applyIntakeFilterToEntries } from "@/lib/garage/filters";
import { groupByYearMakeModel } from "@/lib/garage/grouping";

const entry = (overrides: Parameters<typeof makeFixtureListingObject>[0] = {}) => ({
  listing: makeFixtureListingObject(overrides),
});

describe("applyIntakeFilterToEntries — title preference", () => {
  test("clean-only drops rebuilt and unknown listings", () => {
    const entries = [
      entry({ id: "a", titleStatus: "clean" }),
      entry({ id: "b", titleStatus: "rebuilt" }),
      entry({ id: "c", titleStatus: "unknown" }),
    ];
    const filtered = applyIntakeFilterToEntries(
      entries,
      makeFixtureIntakeState({ titlePreference: "clean" }),
    );
    expect(filtered.map((e) => e.listing.id)).toEqual(["a"]);
  });

  test("rebuilt-only drops clean and unknown listings", () => {
    const entries = [
      entry({ id: "a", titleStatus: "clean" }),
      entry({ id: "b", titleStatus: "rebuilt" }),
    ];
    const filtered = applyIntakeFilterToEntries(
      entries,
      makeFixtureIntakeState({ titlePreference: "rebuilt" }),
    );
    expect(filtered.map((e) => e.listing.id)).toEqual(["b"]);
  });

  test("both renders every listing regardless of title", () => {
    const entries = [
      entry({ id: "a", titleStatus: "clean" }),
      entry({ id: "b", titleStatus: "rebuilt" }),
      entry({ id: "c", titleStatus: "unknown" }),
    ];
    const filtered = applyIntakeFilterToEntries(
      entries,
      makeFixtureIntakeState({ titlePreference: "both" }),
    );
    expect(filtered.map((e) => e.listing.id)).toEqual(["a", "b", "c"]);
  });
});

describe("applyIntakeFilterToEntries — make/model/year/mileage", () => {
  test("make filter is case-insensitive and exact", () => {
    const entries = [
      entry({ id: "a", make: "Toyota" }),
      entry({ id: "b", make: "Honda" }),
    ];
    const filtered = applyIntakeFilterToEntries(
      entries,
      makeFixtureIntakeState({ make: "toyota" }),
    );
    expect(filtered.map((e) => e.listing.id)).toEqual(["a"]);
  });

  test("yearRange filters inclusively", () => {
    const entries = [
      entry({ id: "a", year: 2018 }),
      entry({ id: "b", year: 2020 }),
      entry({ id: "c", year: 2022 }),
    ];
    const filtered = applyIntakeFilterToEntries(
      entries,
      makeFixtureIntakeState({ yearRange: [2019, 2021] }),
    );
    expect(filtered.map((e) => e.listing.id)).toEqual(["b"]);
  });

  test("mileageMax drops higher-mileage listings", () => {
    const entries = [
      entry({ id: "a", mileage: 40000 }),
      entry({ id: "b", mileage: 90000 }),
    ];
    const filtered = applyIntakeFilterToEntries(
      entries,
      makeFixtureIntakeState({ mileageMax: 50000 }),
    );
    expect(filtered.map((e) => e.listing.id)).toEqual(["a"]);
  });
});

describe("groupByYearMakeModel", () => {
  test("groups identical YMM into one bucket and preserves first-seen order", () => {
    const entries = [
      entry({ id: "a", year: 2020, make: "Toyota", model: "Tacoma" }),
      entry({ id: "b", year: 2019, make: "Honda", model: "Accord" }),
      entry({ id: "c", year: 2020, make: "Toyota", model: "Tacoma" }),
    ];
    const groups = groupByYearMakeModel(entries);
    expect(groups.map((g) => g.label)).toEqual([
      "2020 Toyota Tacoma",
      "2019 Honda Accord",
    ]);
    expect(groups[0]!.entries).toHaveLength(2);
    expect(groups[1]!.entries).toHaveLength(1);
  });
});
