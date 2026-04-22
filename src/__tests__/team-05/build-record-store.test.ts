import { describe, expect, test } from "vitest";
import { makeFixtureBuildRecord } from "@/contracts";
import { _buildRecordReducer } from "@/lib/compare/build-record-store";

describe("BuildRecord reducer", () => {
  test("setCustomization flips a key on the customizations map", () => {
    const base = makeFixtureBuildRecord({ userId: "u1" });
    const next = _buildRecordReducer(base, {
      type: "setCustomization",
      key: "wrap",
      value: true,
    });
    expect(next.customizations.wrap).toBe(true);
    expect(next.customizations.paint).toBeUndefined();
  });

  test("setCustomization retains prior toggles", () => {
    const base = makeFixtureBuildRecord({
      userId: "u1",
      customizations: { wrap: true },
    });
    const next = _buildRecordReducer(base, {
      type: "setCustomization",
      key: "paint",
      value: true,
    });
    expect(next.customizations).toEqual({ wrap: true, paint: true });
  });

  test("setTradeIn writes a TradeIn payload", () => {
    const base = makeFixtureBuildRecord({ userId: "u1" });
    const next = _buildRecordReducer(base, {
      type: "setTradeIn",
      tradeIn: { vin: "1HGCM82633A004352", titleStatus: "clean", estimatedValue: 5400 },
    });
    expect(next.tradeIn?.estimatedValue).toBe(5400);
  });

  test("setTradeIn with undefined clears the trade-in", () => {
    const base = makeFixtureBuildRecord({
      userId: "u1",
      tradeIn: { vin: "1HGCM82633A004352", titleStatus: "clean" },
    });
    const next = _buildRecordReducer(base, { type: "setTradeIn", tradeIn: undefined });
    expect(next.tradeIn).toBeUndefined();
  });

  test("setAlreadyHaveACar stores the requested work list", () => {
    const base = makeFixtureBuildRecord({ userId: "u1" });
    const next = _buildRecordReducer(base, {
      type: "setAlreadyHaveACar",
      alreadyHaveACar: {
        vin: "1HGCM82633A004352",
        requestedWork: ["wrap", "seats"],
      },
    });
    expect(next.alreadyHaveACar?.requestedWork).toEqual(["wrap", "seats"]);
  });

  test("setListing updates the anchored listingId", () => {
    const base = makeFixtureBuildRecord({ userId: "u1" });
    const next = _buildRecordReducer(base, { type: "setListing", listingId: "lst_9" });
    expect(next.listingId).toBe("lst_9");
  });
});
