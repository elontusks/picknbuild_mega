import { describe, expect, test } from "vitest";
import {
  applyTitleFilter,
  creditBandDisplay,
  diffActiveFilters,
  intakeToListingsQuery,
} from "@/lib/intake/helpers";
import {
  makeFixtureIntakeState,
  makeFixtureListingObject,
  type IntakeState,
} from "@/contracts";

describe("applyTitleFilter (§2 rule: strict hides unknown, both shows all)", () => {
  const clean = makeFixtureListingObject({ id: "c", titleStatus: "clean" });
  const rebuilt = makeFixtureListingObject({ id: "r", titleStatus: "rebuilt" });
  const unknown = makeFixtureListingObject({ id: "u", titleStatus: "unknown" });
  const all = [clean, rebuilt, unknown];

  test("'both' returns every listing unchanged", () => {
    expect(applyTitleFilter(all, "both")).toEqual(all);
  });

  test("'clean' hides rebuilt AND unknown", () => {
    const out = applyTitleFilter(all, "clean");
    expect(out.map((l) => l.id)).toEqual(["c"]);
  });

  test("'rebuilt' hides clean AND unknown", () => {
    const out = applyTitleFilter(all, "rebuilt");
    expect(out.map((l) => l.id)).toEqual(["r"]);
  });

  test("'clean' and 'rebuilt' produce disjoint sets (no unknown leak)", () => {
    const cleanOut = applyTitleFilter(all, "clean");
    const rebuiltOut = applyTitleFilter(all, "rebuilt");
    const intersection = cleanOut.filter((l) =>
      rebuiltOut.some((r) => r.id === l.id),
    );
    expect(intersection).toHaveLength(0);
    for (const l of cleanOut) expect(l.titleStatus).toBe("clean");
    for (const l of rebuiltOut) expect(l.titleStatus).toBe("rebuilt");
  });
});

describe("creditBandDisplay", () => {
  test("noCredit returns locked + 22% helper", () => {
    const d = creditBandDisplay({ noCredit: true });
    expect(d.tone).toBe("locked");
    expect(d.helper).toContain("22%");
  });

  test("undefined score returns locked", () => {
    const d = creditBandDisplay({ noCredit: false });
    expect(d.tone).toBe("locked");
  });

  test("sub-600 is locked", () => {
    expect(creditBandDisplay({ creditScore: 580, noCredit: false }).tone).toBe(
      "locked",
    );
  });

  test("600-649 → red", () => {
    expect(creditBandDisplay({ creditScore: 620, noCredit: false }).tone).toBe(
      "red",
    );
    expect(creditBandDisplay({ creditScore: 649, noCredit: false }).tone).toBe(
      "red",
    );
  });

  test("650-699 → yellow", () => {
    expect(creditBandDisplay({ creditScore: 650, noCredit: false }).tone).toBe(
      "yellow",
    );
    expect(creditBandDisplay({ creditScore: 699, noCredit: false }).tone).toBe(
      "yellow",
    );
  });

  test("700+ → green", () => {
    expect(creditBandDisplay({ creditScore: 720, noCredit: false }).tone).toBe(
      "green",
    );
    expect(creditBandDisplay({ creditScore: 810, noCredit: false }).tone).toBe(
      "green",
    );
  });
});

describe("diffActiveFilters", () => {
  const baseline = makeFixtureIntakeState({
    location: { zip: "43210" },
    cash: 5000,
    creditScore: 680,
    noCredit: false,
    titlePreference: "both",
    matchMode: false,
  });

  test("identical states produce an empty list", () => {
    expect(diffActiveFilters(baseline, baseline)).toEqual([]);
  });

  test("adds every changed filter field", () => {
    const active: IntakeState = {
      ...baseline,
      make: "Honda",
      model: "Accord",
      yearRange: [2015, 2022],
      mileageMax: 80000,
      trim: "Sport",
      titlePreference: "clean",
      matchMode: true,
    };
    const diffs = diffActiveFilters(active, baseline);
    expect(new Set(diffs)).toEqual(
      new Set([
        "make",
        "model",
        "yearRange",
        "mileageMax",
        "trim",
        "titlePreference",
        "matchMode",
      ]),
    );
  });

  test("ignores non-filter fields (cash / credit / zip / term)", () => {
    const active: IntakeState = {
      ...baseline,
      cash: 9999,
      creditScore: 780,
      noCredit: false,
      selectedTerm: "3y",
      location: { zip: "90210" },
    };
    expect(diffActiveFilters(active, baseline)).toEqual([]);
  });

  test("same range tuple counts as unchanged", () => {
    const withRange: IntakeState = { ...baseline, yearRange: [2010, 2020] };
    const same: IntakeState = { ...baseline, yearRange: [2010, 2020] };
    expect(diffActiveFilters(withRange, same)).toEqual([]);
  });
});

describe("intakeToListingsQuery", () => {
  test("omits title param when preference is 'both'", () => {
    const q = intakeToListingsQuery(
      makeFixtureIntakeState({ titlePreference: "both" }),
    );
    expect(q.includes("titlePreference")).toBe(false);
  });

  test("sets title param when preference is strict", () => {
    const q = intakeToListingsQuery(
      makeFixtureIntakeState({ titlePreference: "clean" }),
    );
    expect(q).toContain("titlePreference=clean");
  });

  test("includes make/model/trim/year/mileage when set", () => {
    const s = makeFixtureIntakeState({
      make: "Honda",
      model: "Accord",
      yearRange: [2015, 2022],
      mileageMax: 80000,
      location: { zip: "43210" },
    });
    const q = intakeToListingsQuery(s);
    expect(q).toContain("make=Honda");
    expect(q).toContain("model=Accord");
    expect(q).toContain("yearMin=2015");
    expect(q).toContain("yearMax=2022");
    expect(q).toContain("mileageMax=80000");
    expect(q).toContain("limit=24");
  });

  test("does not include zip — profile ZIP is display-only context, not a hard filter", () => {
    const q = intakeToListingsQuery(
      makeFixtureIntakeState({ location: { zip: "43065" } }),
    );
    expect(q.includes("zip=")).toBe(false);
  });

  test("skips undefined optional fields", () => {
    const q = intakeToListingsQuery(
      makeFixtureIntakeState({
        make: undefined,
        model: undefined,
        yearRange: undefined,
        mileageMax: undefined,
      }),
    );
    expect(q.includes("make=")).toBe(false);
    expect(q.includes("yearMin=")).toBe(false);
  });
});
