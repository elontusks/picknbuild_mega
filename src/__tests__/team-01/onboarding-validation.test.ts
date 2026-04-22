import { describe, expect, test } from "vitest";
import { validateOnboarding } from "@/services/team-01-auth";

describe("validateOnboarding", () => {
  test("requires a 5-digit ZIP", () => {
    expect(validateOnboarding({})).toEqual({
      ok: false,
      error: "ZIP must be a 5-digit code.",
    });
    expect(validateOnboarding({ zip: "abc" })).toEqual({
      ok: false,
      error: "ZIP must be a 5-digit code.",
    });
    expect(validateOnboarding({ zip: "1234" })).toEqual({
      ok: false,
      error: "ZIP must be a 5-digit code.",
    });
  });

  test("trims ZIP whitespace", () => {
    const r = validateOnboarding({ zip: "  43210  " });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.zip).toBe("43210");
  });

  test("budget must be non-negative", () => {
    expect(validateOnboarding({ zip: "43210", budget: -1 })).toEqual({
      ok: false,
      error: "Budget must be a non-negative number.",
    });
  });

  test("credit score must be 300–850", () => {
    expect(validateOnboarding({ zip: "43210", creditScore: 100 }).ok).toBe(false);
    expect(validateOnboarding({ zip: "43210", creditScore: 900 }).ok).toBe(false);
    expect(validateOnboarding({ zip: "43210", creditScore: 700 }).ok).toBe(true);
  });

  test("creditScore + noCredit are mutually exclusive", () => {
    const r = validateOnboarding({ zip: "43210", creditScore: 700, noCredit: true });
    expect(r.ok).toBe(false);
  });

  test("rejects unknown bestFit", () => {
    const r = validateOnboarding({
      zip: "43210",
      // @ts-expect-error testing runtime guard
      bestFit: "lowestEverything",
    });
    expect(r.ok).toBe(false);
  });

  test("defaults bestFit and notifChannels", () => {
    const r = validateOnboarding({ zip: "43210" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.bestFit).toBe("lowestTotal");
      expect(r.value.notifChannels).toEqual(["in-app"]);
    }
  });

  test("preserves explicit notifChannels", () => {
    const r = validateOnboarding({
      zip: "43210",
      notifChannels: ["email", "digest"],
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.notifChannels).toEqual(["email", "digest"]);
  });
});
