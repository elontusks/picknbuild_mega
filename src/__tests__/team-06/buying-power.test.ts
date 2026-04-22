import { describe, expect, test } from "vitest";
import { computeBuyingPower } from "@/lib/decision";
import { makeFixtureIntakeState, makeFixturePathQuote } from "@/contracts";

describe("computeBuyingPower", () => {
  test("cash under total: outside money = gap, buying power = cash", () => {
    const intake = makeFixtureIntakeState({ cash: 3000 });
    const quote = makeFixturePathQuote({ total: 20000 });
    const layer = computeBuyingPower(intake, quote);
    expect(layer.yourCash).toBe(3000);
    expect(layer.totalCost).toBe(20000);
    expect(layer.buyingPower).toBe(3000);
    expect(layer.outsideMoneyNeeded).toBe(17000);
  });

  test("cash covers total: outside money = 0, buying power = total", () => {
    const intake = makeFixtureIntakeState({ cash: 25000 });
    const quote = makeFixturePathQuote({ total: 20000 });
    const layer = computeBuyingPower(intake, quote);
    expect(layer.buyingPower).toBe(20000);
    expect(layer.outsideMoneyNeeded).toBe(0);
  });

  test("cash exactly matches total", () => {
    const layer = computeBuyingPower({ cash: 12500 }, { total: 12500 });
    expect(layer.buyingPower).toBe(12500);
    expect(layer.outsideMoneyNeeded).toBe(0);
  });

  test("zero cash floors buying power to 0", () => {
    const layer = computeBuyingPower({ cash: 0 }, { total: 15000 });
    expect(layer.yourCash).toBe(0);
    expect(layer.buyingPower).toBe(0);
    expect(layer.outsideMoneyNeeded).toBe(15000);
  });

  test("negative cash clamps to 0", () => {
    const layer = computeBuyingPower({ cash: -500 }, { total: 10000 });
    expect(layer.yourCash).toBe(0);
    expect(layer.buyingPower).toBe(0);
    expect(layer.outsideMoneyNeeded).toBe(10000);
  });

  test("zero-total quote (free / parse fail) yields zero everywhere", () => {
    const layer = computeBuyingPower({ cash: 3000 }, { total: 0 });
    expect(layer.totalCost).toBe(0);
    expect(layer.buyingPower).toBe(0);
    expect(layer.outsideMoneyNeeded).toBe(0);
  });

  test("rounds fractional cash/total", () => {
    const layer = computeBuyingPower({ cash: 3000.7 }, { total: 20000.4 });
    expect(layer.yourCash).toBe(3001);
    expect(layer.totalCost).toBe(20000);
  });
});
