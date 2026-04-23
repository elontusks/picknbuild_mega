// @vitest-environment jsdom
import { beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { makeFixtureBuildRecord } from "@/contracts";

const hoisted = vi.hoisted(() => ({
  saveBuildDraft: vi.fn(),
  computePicknbuildPrice: vi.fn(),
  push: vi.fn(),
}));

vi.mock("@/app/configurator/actions", () => ({
  saveBuildDraft: (...a: unknown[]) => hoisted.saveBuildDraft(...a),
}));

vi.mock("@/services/team-11-pricing", async () => {
  const actual = await vi.importActual<typeof import("@/services/team-11-pricing")>(
    "@/services/team-11-pricing",
  );
  return {
    ...actual,
    computePicknbuildPrice: (
      ...a: Parameters<typeof actual.computePicknbuildPrice>
    ) => hoisted.computePicknbuildPrice(...a),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: hoisted.push }),
}));

import { ConfiguratorClient } from "@/components/configurator/configurator-client";

const defaultPrice = {
  total: 18000,
  down: 3600,
  remaining: 14400,
  biweekly: 180,
  downPercentage: 0.2,
  term: "3y" as const,
};

beforeEach(() => {
  hoisted.saveBuildDraft.mockReset();
  hoisted.computePicknbuildPrice.mockReset();
  hoisted.push.mockReset();
  hoisted.computePicknbuildPrice.mockImplementation(() => defaultPrice);
  hoisted.saveBuildDraft.mockResolvedValue({
    ok: true,
    buildRecordId: "b_1",
  });
});

const renderConfigurator = () =>
  render(
    <ConfiguratorClient
      initialBuild={makeFixtureBuildRecord({
        id: "b_1",
        userId: "u_1",
        selectedPackage: "standard",
      })}
      isPersisted={true}
      viewer={{ creditScore: 680, noCredit: false }}
    />,
  );

describe("ConfiguratorClient", () => {
  test("renders all five package cards + the four customization toggles + live price panel", () => {
    renderConfigurator();
    expect(screen.getByTestId("package-card-standard")).toBeTruthy();
    expect(screen.getByTestId("package-card-premium")).toBeTruthy();
    expect(screen.getByTestId("package-card-silver")).toBeTruthy();
    expect(screen.getByTestId("package-card-platinum")).toBeTruthy();
    expect(screen.getByTestId("package-card-gold")).toBeTruthy();

    expect(screen.getByTestId("customization-input-wrap")).toBeTruthy();
    expect(screen.getByTestId("customization-input-seats")).toBeTruthy();
    expect(screen.getByTestId("customization-input-starlight")).toBeTruthy();
    expect(screen.getByTestId("customization-input-paint")).toBeTruthy();

    expect(screen.getByTestId("live-price-panel")).toBeTruthy();
    expect(screen.getByTestId("live-total").textContent).toContain("$18,000");
  });

  test("toggling a customization triggers a re-quote through Team 11 pricing", () => {
    renderConfigurator();
    const callsBefore = hoisted.computePicknbuildPrice.mock.calls.length;
    fireEvent.click(screen.getByTestId("customization-input-wrap"));
    const callsAfter = hoisted.computePicknbuildPrice.mock.calls.length;
    expect(callsAfter).toBeGreaterThan(callsBefore);
    const lastCall = hoisted.computePicknbuildPrice.mock.calls.at(-1)?.[0];
    expect(lastCall?.customizationsTotal).toBeGreaterThan(0);
  });

  test("selecting a new package re-quotes with the new basePrice", () => {
    renderConfigurator();
    hoisted.computePicknbuildPrice.mockClear();
    fireEvent.click(screen.getByTestId("package-card-gold"));
    const lastCall = hoisted.computePicknbuildPrice.mock.calls.at(-1)?.[0];
    expect(lastCall?.basePrice).toBe(72000);
  });

  test("Save draft persists the current customizations via saveBuildDraft", async () => {
    renderConfigurator();
    fireEvent.click(screen.getByTestId("customization-input-wrap"));
    fireEvent.click(screen.getByTestId("configurator-save"));
    // The transition runs the action async; flush the microtasks.
    await Promise.resolve();
    await Promise.resolve();
    expect(hoisted.saveBuildDraft).toHaveBeenCalled();
    const arg = hoisted.saveBuildDraft.mock.calls.at(-1)?.[0];
    expect(arg).toMatchObject({
      buildRecordId: "b_1",
      selectedPackage: "standard",
      customizations: { wrap: true },
    });
  });

  test("when isPersisted=false, the first save omits buildRecordId so the server mints one", async () => {
    render(
      <ConfiguratorClient
        initialBuild={makeFixtureBuildRecord({
          id: "seed_client_only",
          userId: "u_1",
          selectedPackage: "standard",
        })}
        isPersisted={false}
        viewer={{ creditScore: 680, noCredit: false }}
      />,
    );
    fireEvent.click(screen.getByTestId("customization-input-wrap"));
    fireEvent.click(screen.getByTestId("configurator-save"));
    await Promise.resolve();
    await Promise.resolve();
    const arg = hoisted.saveBuildDraft.mock.calls.at(-1)?.[0] as
      | { buildRecordId?: string }
      | undefined;
    expect(arg?.buildRecordId).toBeUndefined();
  });
});
