// @vitest-environment jsdom
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeFixtureUser } from "@/contracts";

const hoisted = vi.hoisted(() => ({
  requireUser: vi.fn(),
  loadUserById: vi.fn(),
}));

vi.mock("@/services/team-01-auth", () => ({
  requireUser: (...a: unknown[]) => hoisted.requireUser(...a),
}));

vi.mock("@/lib/profiles/load-user", () => ({
  loadUserById: (...a: unknown[]) => hoisted.loadUserById(...a),
}));

import BuyerProfilePage from "@/app/users/[userId]/page";

describe("Buyer Profile page", () => {
  beforeEach(() => {
    hoisted.requireUser.mockReset();
    hoisted.loadUserById.mockReset();
  });

  test("renders Garage + Inbox links when viewing own profile", async () => {
    const viewer = makeFixtureUser({ id: "u_self", displayName: "Jane Self" });
    hoisted.requireUser.mockResolvedValue(viewer);

    const ui = await BuyerProfilePage({ params: Promise.resolve({ userId: "u_self" }) });
    render(ui);

    expect(hoisted.loadUserById).not.toHaveBeenCalled();
    expect(screen.getByTestId("profile-display-name").textContent).toBe("Jane Self");
    expect(screen.getByTestId("link-garage")).toBeTruthy();
    expect(screen.getByTestId("link-inbox")).toBeTruthy();
    expect(screen.queryByTestId("profile-public-note")).toBeNull();
  });

  test("hides private bits + looks up target user when viewing someone else", async () => {
    const viewer = makeFixtureUser({ id: "u_self" });
    const other = makeFixtureUser({ id: "u_other", displayName: "Other Buyer" });
    hoisted.requireUser.mockResolvedValue(viewer);
    hoisted.loadUserById.mockResolvedValue(other);

    const ui = await BuyerProfilePage({ params: Promise.resolve({ userId: "u_other" }) });
    render(ui);

    expect(hoisted.loadUserById).toHaveBeenCalledWith("u_other");
    expect(screen.getByTestId("profile-display-name").textContent).toBe("Other Buyer");
    expect(screen.getByTestId("saved-search-private")).toBeTruthy();
    expect(screen.queryByTestId("link-garage")).toBeNull();
    expect(screen.queryByTestId("link-inbox")).toBeNull();
  });
});
