import { describe, expect, test } from "vitest";
import { intakeReducer, initialIntakeFromUser } from "@/lib/intake/reducer";
import { makeFixtureUser, type IntakeState } from "@/contracts";

const base = (): IntakeState =>
  initialIntakeFromUser(
    makeFixtureUser({ zip: "43210", budget: 5000, creditScore: 680 }),
  );

describe("intakeReducer — basic field writes", () => {
  test("set-make trims and normalizes empty to undefined", () => {
    const s1 = intakeReducer(base(), { type: "set-make", make: "  Honda " });
    expect(s1.make).toBe("Honda");
    const s2 = intakeReducer(s1, { type: "set-make", make: "" });
    expect(s2.make).toBeUndefined();
    const s3 = intakeReducer(s1, { type: "set-make", make: undefined });
    expect(s3.make).toBeUndefined();
  });

  test("set-model / set-trim follow the same normalization", () => {
    const s = intakeReducer(base(), { type: "set-model", model: "Accord" });
    expect(s.model).toBe("Accord");
    const s2 = intakeReducer(s, { type: "set-trim", trim: "  Sport " });
    expect(s2.trim).toBe("Sport");
  });

  test("set-year-range writes tuple", () => {
    const s = intakeReducer(base(), {
      type: "set-year-range",
      yearRange: [2015, 2022],
    });
    expect(s.yearRange).toEqual([2015, 2022]);
  });

  test("set-mileage-max stores value or clears it", () => {
    const s = intakeReducer(base(), {
      type: "set-mileage-max",
      mileageMax: 80000,
    });
    expect(s.mileageMax).toBe(80000);
    const cleared = intakeReducer(s, {
      type: "set-mileage-max",
      mileageMax: undefined,
    });
    expect(cleared.mileageMax).toBeUndefined();
  });

  test("set-cash floors at zero", () => {
    const s = intakeReducer(base(), { type: "set-cash", cash: -500 });
    expect(s.cash).toBe(0);
  });
});

describe("intakeReducer — credit / no-credit interaction", () => {
  test("setting a credit score clears noCredit", () => {
    const s1 = intakeReducer(base(), { type: "set-no-credit", noCredit: true });
    expect(s1.noCredit).toBe(true);
    expect(s1.creditScore).toBeUndefined();

    const s2 = intakeReducer(s1, { type: "set-credit-score", creditScore: 720 });
    expect(s2.noCredit).toBe(false);
    expect(s2.creditScore).toBe(720);
  });

  test("toggling noCredit on clears creditScore", () => {
    const s = intakeReducer(base(), { type: "set-no-credit", noCredit: true });
    expect(s.noCredit).toBe(true);
    expect(s.creditScore).toBeUndefined();
  });

  test("toggling noCredit off does not resurrect a creditScore", () => {
    const s = intakeReducer(base(), { type: "set-no-credit", noCredit: true });
    const s2 = intakeReducer(s, { type: "set-no-credit", noCredit: false });
    expect(s2.noCredit).toBe(false);
    expect(s2.creditScore).toBeUndefined();
  });
});

describe("intakeReducer — title / match mode / term", () => {
  test("title preference cycles through all three", () => {
    let s = base();
    for (const p of ["clean", "rebuilt", "both"] as const) {
      s = intakeReducer(s, { type: "set-title-preference", titlePreference: p });
      expect(s.titlePreference).toBe(p);
    }
  });

  test("match mode toggles", () => {
    const s = intakeReducer(base(), { type: "set-match-mode", matchMode: true });
    expect(s.matchMode).toBe(true);
    const s2 = intakeReducer(s, { type: "set-match-mode", matchMode: false });
    expect(s2.matchMode).toBe(false);
  });

  test("selected term writes / clears", () => {
    const s = intakeReducer(base(), {
      type: "set-selected-term",
      selectedTerm: "3y",
    });
    expect(s.selectedTerm).toBe("3y");
    const s2 = intakeReducer(s, {
      type: "set-selected-term",
      selectedTerm: undefined,
    });
    expect(s2.selectedTerm).toBeUndefined();
  });
});

describe("intakeReducer — hydrate / reset", () => {
  test("hydrate replaces state wholesale", () => {
    const s1 = intakeReducer(base(), { type: "set-make", make: "Ford" });
    const replacement: IntakeState = {
      ...base(),
      make: "Toyota",
      titlePreference: "rebuilt",
      matchMode: true,
    };
    const s2 = intakeReducer(s1, { type: "hydrate", state: replacement });
    expect(s2.make).toBe("Toyota");
    expect(s2.titlePreference).toBe("rebuilt");
    expect(s2.matchMode).toBe(true);
  });

  test("reset swaps back to the baseline state", () => {
    const s1 = intakeReducer(base(), { type: "set-make", make: "Ford" });
    const s2 = intakeReducer(s1, { type: "reset", state: base() });
    expect(s2.make).toBeUndefined();
  });
});

describe("initialIntakeFromUser", () => {
  test("pulls zip / cash / credit / noCredit off the User record", () => {
    const user = makeFixtureUser({
      zip: "11211",
      budget: 4200,
      creditScore: 710,
      noCredit: false,
    });
    const s = initialIntakeFromUser(user);
    expect(s.location.zip).toBe("11211");
    expect(s.cash).toBe(4200);
    expect(s.creditScore).toBe(710);
    expect(s.noCredit).toBe(false);
    expect(s.titlePreference).toBe("both");
    expect(s.matchMode).toBe(false);
  });

  test("missing budget → cash floors at 0", () => {
    const user = makeFixtureUser({ budget: undefined });
    const s = initialIntakeFromUser(user);
    expect(s.cash).toBe(0);
  });

  test("respects noCredit on the User", () => {
    const user = makeFixtureUser({ noCredit: true, creditScore: undefined });
    const s = initialIntakeFromUser(user);
    expect(s.noCredit).toBe(true);
  });
});
