// @vitest-environment jsdom
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeFixtureListingObject, makeFixtureUser } from "@/contracts";

const hoisted = vi.hoisted(() => ({
  requireUser: vi.fn(),
  loadUserById: vi.fn(),
  listListings: vi.fn(),
}));

vi.mock("@/services/team-01-auth", () => ({
  requireUser: (...a: unknown[]) => hoisted.requireUser(...a),
}));

vi.mock("@/services/team-03-supply", () => ({
  listListings: (...a: unknown[]) => hoisted.listListings(...a),
}));

vi.mock("@/lib/profiles/load-user", () => ({
  loadUserById: (...a: unknown[]) => hoisted.loadUserById(...a),
}));

vi.mock("@/services/team-13-messaging", () => ({
  openOrCreateThread: vi.fn(),
}));

import SellerProfilePage from "@/app/sellers/[userId]/page";

describe("Individual Seller Profile page", () => {
  beforeEach(() => {
    hoisted.requireUser.mockReset();
    hoisted.loadUserById.mockReset();
    hoisted.listListings.mockReset();
  });

  test("renders chat handle, message button, and the active user-posted listing", async () => {
    hoisted.requireUser.mockResolvedValue(
      makeFixtureUser({ id: "buyer_1", role: "buyer" }),
    );
    hoisted.loadUserById.mockResolvedValue(
      makeFixtureUser({
        id: "seller_1",
        role: "seller",
        displayName: "Sam Seller",
      }),
    );
    const activeListing = makeFixtureListingObject({
      id: "listing_s1",
      source: "user",
      ownerUserId: "seller_1",
      year: 2017,
      make: "Subaru",
      model: "Outback",
      price: 14500,
    });
    hoisted.listListings.mockResolvedValue([activeListing]);

    const ui = await SellerProfilePage({
      params: Promise.resolve({ userId: "seller_1" }),
    });
    render(ui);

    expect(hoisted.listListings).toHaveBeenCalledWith({
      ownerUserId: "seller_1",
      source: "user",
    });
    expect(screen.getByTestId("seller-chat-handle").textContent).toContain(
      "@samseller",
    );
    const messageBtn = screen.getByTestId("seller-message-button");
    expect(messageBtn.textContent).toContain("@samseller");
    const listingCell = screen.getByTestId("seller-active-listing");
    expect(listingCell.textContent).toContain("Subaru Outback");
  });

  test("falls back to empty-state when seller has no active listing", async () => {
    hoisted.requireUser.mockResolvedValue(
      makeFixtureUser({ id: "buyer_1", role: "buyer" }),
    );
    hoisted.loadUserById.mockResolvedValue(
      makeFixtureUser({ id: "seller_2", role: "seller" }),
    );
    hoisted.listListings.mockResolvedValue([]);

    const ui = await SellerProfilePage({
      params: Promise.resolve({ userId: "seller_2" }),
    });
    render(ui);

    expect(screen.getByTestId("seller-empty")).toBeTruthy();
    expect(screen.queryByTestId("seller-active-listing")).toBeNull();
  });

  test("does not render the Message button for the seller viewing their own page", async () => {
    const seller = makeFixtureUser({
      id: "seller_3",
      role: "seller",
      displayName: "Self Seller",
    });
    hoisted.requireUser.mockResolvedValue(seller);
    hoisted.listListings.mockResolvedValue([]);

    const ui = await SellerProfilePage({
      params: Promise.resolve({ userId: "seller_3" }),
    });
    render(ui);

    expect(hoisted.loadUserById).not.toHaveBeenCalled();
    expect(screen.queryByTestId("seller-message-button")).toBeNull();
  });
});
