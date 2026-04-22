import { describe, expect, test } from "vitest";
import { estimateAlreadyHaveACar } from "@/lib/pricing/already-have-a-car";

describe("estimateAlreadyHaveACar", () => {
  test("VIN-only without work requests requires a quote", () => {
    const r = estimateAlreadyHaveACar({ vin: "X", requestedWork: [] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.missing).toContain("requestedWork");
  });

  test("work requests without vehicle id requires a quote", () => {
    const r = estimateAlreadyHaveACar({ requestedWork: ["wrap"] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.missing[0]).toMatch(/vehicle/);
  });

  test("VIN + known work items returns a summed estimate", () => {
    const r = estimateAlreadyHaveACar({
      vin: "X",
      requestedWork: ["wrap", "seats"],
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.estimate).toBe(3500 + 2800);
      expect(r.lineItems.map((x) => x.label)).toEqual(["wrap", "seats"]);
    }
  });

  test("fallback vehicle details also work", () => {
    const r = estimateAlreadyHaveACar({
      fallback: { year: 2018, make: "Toyota", model: "Camry" },
      requestedWork: ["paint"],
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.estimate).toBe(4200);
  });

  test("unknown work item falls back to shop rate with assumption note", () => {
    const r = estimateAlreadyHaveACar({
      vin: "X",
      requestedWork: ["mystery-job"],
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.estimate).toBe(1500);
      expect(r.assumptions.join(" ")).toMatch(/mystery-job/i);
    }
  });
});
