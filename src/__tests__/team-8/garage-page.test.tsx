// @vitest-environment jsdom
import { beforeEach, describe, expect, test, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import {
  makeFixtureListingObject,
  makeFixturePathQuote,
  makeFixtureUser,
} from "@/contracts";
import type { GarageItem } from "@/lib/garage/store";

const hoisted = vi.hoisted(() => ({
  requireUser: vi.fn(),
  listGarageItems: vi.fn(),
  getListing: vi.fn(),
  getConversionState: vi.fn(),
  quoteAllPaths: vi.fn(),
}));

vi.mock("@/services/team-01-auth", () => ({
  requireUser: (...a: unknown[]) => hoisted.requireUser(...a),
}));

vi.mock("@/services/team-03-supply", () => ({
  getListing: (...a: unknown[]) => hoisted.getListing(...a),
}));

vi.mock("@/services/team-12-workflows", () => ({
  getConversionState: (...a: unknown[]) => hoisted.getConversionState(...a),
}));

vi.mock("@/lib/garage/store", async () => {
  const actual = await vi.importActual<typeof import("@/lib/garage/store")>(
    "@/lib/garage/store",
  );
  return {
    ...actual,
    listGarageItems: (...a: unknown[]) => hoisted.listGarageItems(...a),
  };
});

vi.mock("@/services/team-11-pricing", () => ({
  quoteAllPaths: (...a: unknown[]) => hoisted.quoteAllPaths(...a),
}));

import GaragePage from "@/app/garage/page";

const buyer = () => makeFixtureUser({ id: "u_1", role: "buyer", zip: "43210" });

const item = (listingId: string, decision: GarageItem["decision"] = null): GarageItem => ({
  userId: "u_1",
  listingId,
  addedAt: new Date().toISOString(),
  decision,
  groupKey: "2020-toyota-tacoma",
});

describe("Garage page (server render)", () => {
  beforeEach(() => {
    Object.values(hoisted).forEach((mock) => mock.mockReset());
    hoisted.quoteAllPaths.mockImplementation(async () => [
      makeFixturePathQuote({ path: "dealer", total: 24000, monthly: 420, approvedBool: true }),
      makeFixturePathQuote({ path: "auction", total: 15000, approvedBool: true }),
      makeFixturePathQuote({ path: "picknbuild", total: 22000, biweekly: 180 }),
      makeFixturePathQuote({ path: "private", total: 18500 }),
    ]);
    window.localStorage.clear();
  });

  test("renders empty state when no items are saved", async () => {
    hoisted.requireUser.mockResolvedValue(buyer());
    hoisted.listGarageItems.mockResolvedValue([]);

    const ui = await GaragePage();
    await act(async () => {
      render(ui);
    });

    expect(screen.getByTestId("garage-empty")).toBeTruthy();
    expect(hoisted.getListing).not.toHaveBeenCalled();
  });

  test("groups saved vehicles by YMM and renders one card per entry", async () => {
    hoisted.requireUser.mockResolvedValue(buyer());
    hoisted.listGarageItems.mockResolvedValue([
      item("l_1"),
      item("l_2"),
      item("l_3"),
    ]);
    hoisted.getListing.mockImplementation(async (id: string) => {
      if (id === "l_1")
        return makeFixtureListingObject({ id, year: 2020, make: "Toyota", model: "Tacoma" });
      if (id === "l_2")
        return makeFixtureListingObject({ id, year: 2020, make: "Toyota", model: "Tacoma" });
      if (id === "l_3")
        return makeFixtureListingObject({ id, year: 2019, make: "Honda", model: "Accord" });
      return null;
    });
    hoisted.getConversionState.mockResolvedValue("decided");

    const ui = await GaragePage();
    await act(async () => {
      render(ui);
    });

    const groups = screen.getAllByTestId("garage-group");
    expect(groups).toHaveLength(2);
    expect(groups[0]!.getAttribute("data-group-key")).toBe("2020-toyota-tacoma");
    expect(
      within(groups[0]!).getAllByTestId("garage-item-card"),
    ).toHaveLength(2);
    expect(
      within(groups[1]!).getAllByTestId("garage-item-card"),
    ).toHaveLength(1);
  });

  test("shows the 'In progress' chip when conversion state has moved past decided", async () => {
    hoisted.requireUser.mockResolvedValue(buyer());
    hoisted.listGarageItems.mockResolvedValue([item("l_1")]);
    hoisted.getListing.mockResolvedValue(
      makeFixtureListingObject({ id: "l_1" }),
    );
    hoisted.getConversionState.mockResolvedValue("payment-initiated");

    const ui = await GaragePage();
    await act(async () => {
      render(ui);
    });

    expect(screen.getByTestId("garage-action-in-progress")).toBeTruthy();
    expect(screen.queryByTestId("garage-action-start-picknbuild")).toBeNull();
  });

  test("surfaces contact-dealer action for dealer listings and message-seller for private listings", async () => {
    hoisted.requireUser.mockResolvedValue(buyer());
    hoisted.listGarageItems.mockResolvedValue([item("l_1"), item("l_2")]);
    hoisted.getListing.mockImplementation(async (id: string) => {
      if (id === "l_1")
        return makeFixtureListingObject({ id, source: "dealer" });
      if (id === "l_2") return makeFixtureListingObject({ id, source: "user" });
      return null;
    });
    hoisted.getConversionState.mockResolvedValue("decided");

    const ui = await GaragePage();
    await act(async () => {
      render(ui);
    });

    const buttons = screen.getAllByTestId("garage-action-message");
    const kinds = buttons.map((b) => b.getAttribute("data-kind")).sort();
    expect(kinds).toEqual(["buyer-dealer", "buyer-seller"]);
  });

  test("renders the comparison table with one row per (vehicle, path) pair", async () => {
    hoisted.requireUser.mockResolvedValue(buyer());
    hoisted.listGarageItems.mockResolvedValue([item("l_1"), item("l_2")]);
    hoisted.getListing.mockImplementation(async (id: string) =>
      makeFixtureListingObject({ id }),
    );
    hoisted.getConversionState.mockResolvedValue("decided");

    const ui = await GaragePage();
    await act(async () => {
      render(ui);
    });
    // Wait one microtask so the client-side quote fetch resolves.
    await act(async () => {
      await Promise.resolve();
    });

    const table = screen.getByTestId("garage-comparison-table");
    // 2 entries × 4 paths = 8 rows.
    const rows = within(table).getAllByTestId(/garage-compare-row-/);
    expect(rows).toHaveLength(8);
  });

  test("intake title filter (clean-only in localStorage) hides rebuilt listings", async () => {
    window.localStorage.setItem(
      "picknbuild:intake:v1:u_1",
      JSON.stringify({
        version: 1,
        state: {
          location: { zip: "43210" },
          cash: 5000,
          creditScore: 680,
          noCredit: false,
          titlePreference: "clean",
          matchMode: false,
        },
      }),
    );

    hoisted.requireUser.mockResolvedValue(buyer());
    hoisted.listGarageItems.mockResolvedValue([item("l_1"), item("l_2")]);
    hoisted.getListing.mockImplementation(async (id: string) => {
      if (id === "l_1")
        return makeFixtureListingObject({ id, titleStatus: "clean" });
      if (id === "l_2")
        return makeFixtureListingObject({ id, titleStatus: "rebuilt" });
      return null;
    });
    hoisted.getConversionState.mockResolvedValue("decided");

    const ui = await GaragePage();
    await act(async () => {
      render(ui);
    });
    // Let the IntakeProvider's hydration effect run and re-render.
    await act(async () => {
      await Promise.resolve();
    });

    const cards = screen.getAllByTestId("garage-item-card");
    expect(cards).toHaveLength(1);
    expect(cards[0]!.getAttribute("data-listing-id")).toBe("l_1");

    const filter = screen.getByTestId("garage-filter-integration");
    expect(filter.textContent).toMatch(/showing 1 of 2/i);
  });
});
