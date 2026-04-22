// @vitest-environment jsdom
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeFixtureListingObject, makeFixtureUser } from "@/contracts";

const hoisted = vi.hoisted(() => ({
  requireUser: vi.fn(),
  loadUserById: vi.fn(),
  listListings: vi.fn(),
  getSubscription: vi.fn(),
}));

vi.mock("@/services/team-01-auth", () => ({
  requireUser: (...a: unknown[]) => hoisted.requireUser(...a),
}));

vi.mock("@/services/team-03-supply", () => ({
  listListings: (...a: unknown[]) => hoisted.listListings(...a),
  getListing: vi.fn(),
  markListingStatus: vi.fn(),
  upsertDealerListing: vi.fn(),
}));

vi.mock("@/services/team-14-payments", () => ({
  getSubscription: (...a: unknown[]) => hoisted.getSubscription(...a),
}));

vi.mock("@/lib/profiles/load-user", () => ({
  loadUserById: (...a: unknown[]) => hoisted.loadUserById(...a),
}));

// Team 13 open-thread is wired from a server action imported by the page's
// form `action`. It's a function reference, so the import path just needs to
// not blow up.
vi.mock("@/services/team-13-messaging", () => ({
  openOrCreateThread: vi.fn(),
}));

import DealerProfilePage from "@/app/dealers/[userId]/page";

const dealerUser = () =>
  makeFixtureUser({ id: "d_owner", role: "dealer", displayName: "Honest Autos" });
const buyerUser = () =>
  makeFixtureUser({ id: "buyer_1", role: "buyer", displayName: "Jane Buyer" });

const dealerListings = () => [
  makeFixtureListingObject({
    id: "l1",
    source: "dealer",
    ownerUserId: "d_owner",
    year: 2020,
    make: "Toyota",
    model: "Tacoma",
    price: 24000,
  }),
  makeFixtureListingObject({
    id: "l2",
    source: "dealer",
    ownerUserId: "d_owner",
    year: 2019,
    make: "Honda",
    model: "Accord",
    price: 18500,
  }),
];

describe("Dealer Profile page", () => {
  beforeEach(() => {
    hoisted.requireUser.mockReset();
    hoisted.loadUserById.mockReset();
    hoisted.listListings.mockReset();
    hoisted.getSubscription.mockReset();
  });

  test("renders active dealer listings grid for a visiting buyer", async () => {
    hoisted.requireUser.mockResolvedValue(buyerUser());
    hoisted.loadUserById.mockResolvedValue(dealerUser());
    hoisted.listListings.mockResolvedValue(dealerListings());

    const ui = await DealerProfilePage({
      params: Promise.resolve({ userId: "d_owner" }),
    });
    render(ui);

    expect(hoisted.listListings).toHaveBeenCalledWith({
      ownerUserId: "d_owner",
      source: "dealer",
    });
    const grid = screen.getByTestId("dealer-listings-grid");
    expect(grid.querySelectorAll('[data-testid="vehicle-card"]').length).toBe(2);
    expect(grid.textContent).toContain("Toyota Tacoma");
    expect(grid.textContent).toContain("Honda Accord");
    expect(screen.getByTestId("dealer-message-button")).toBeTruthy();
  });

  test("hides edit panel from non-owning dealer viewers", async () => {
    hoisted.requireUser.mockResolvedValue(buyerUser());
    hoisted.loadUserById.mockResolvedValue(dealerUser());
    hoisted.listListings.mockResolvedValue(dealerListings());

    const ui = await DealerProfilePage({
      params: Promise.resolve({ userId: "d_owner" }),
    });
    render(ui);

    expect(screen.queryByTestId("dealer-edit-panel")).toBeNull();
    expect(hoisted.getSubscription).not.toHaveBeenCalled();
  });

  test("shows edit panel for the owning dealer and wires subscription state", async () => {
    hoisted.requireUser.mockResolvedValue(dealerUser());
    hoisted.getSubscription.mockResolvedValue(null);
    hoisted.listListings.mockResolvedValue(dealerListings());

    const ui = await DealerProfilePage({
      params: Promise.resolve({ userId: "d_owner" }),
    });
    render(ui);

    // When viewer === target, page reuses viewer and skips loadUserById.
    expect(hoisted.loadUserById).not.toHaveBeenCalled();
    expect(hoisted.getSubscription).toHaveBeenCalledWith("d_owner");
    expect(screen.getByTestId("dealer-edit-panel")).toBeTruthy();
    expect(screen.getByTestId("dealer-subscription-panel")).toBeTruthy();
    // Owner-side "post a new listing" form is rendered.
    expect(screen.getByTestId("dealer-listing-new-form")).toBeTruthy();
    // No public "message dealer" button when viewing your own page.
    expect(screen.queryByTestId("dealer-message-button")).toBeNull();
  });
});
