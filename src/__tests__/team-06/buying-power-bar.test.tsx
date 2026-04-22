// @vitest-environment jsdom
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { BuyingPowerVisualizationBar } from "@/components/decision/buying-power-bar";

describe("BuyingPowerVisualizationBar", () => {
  test("renders both segments when outside money needed", () => {
    render(
      <BuyingPowerVisualizationBar
        layer={{
          yourCash: 3000,
          totalCost: 20000,
          buyingPower: 3000,
          outsideMoneyNeeded: 17000,
        }}
      />,
    );
    expect(screen.getByTestId("bp-cash-segment")).toBeTruthy();
    expect(screen.getByTestId("bp-outside-segment")).toBeTruthy();
    expect(screen.getByTestId("bp-your-cash").textContent).toContain("$3,000");
    expect(screen.getByTestId("bp-outside").textContent).toContain("$17,000");
  });

  test("shows covered chip when outside money is zero", () => {
    render(
      <BuyingPowerVisualizationBar
        layer={{
          yourCash: 25000,
          totalCost: 20000,
          buyingPower: 20000,
          outsideMoneyNeeded: 0,
        }}
      />,
    );
    expect(screen.queryByTestId("bp-outside-segment")).toBeNull();
    expect(screen.getByTestId("bp-covered").textContent).toContain("Covered");
  });

  test("meter role reports cash vs total", () => {
    render(
      <BuyingPowerVisualizationBar
        layer={{
          yourCash: 4000,
          totalCost: 10000,
          buyingPower: 4000,
          outsideMoneyNeeded: 6000,
        }}
      />,
    );
    const meter = screen.getByRole("meter");
    expect(meter.getAttribute("aria-valuenow")).toBe("4000");
    expect(meter.getAttribute("aria-valuemax")).toBe("10000");
  });
});
