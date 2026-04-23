import { beforeEach, describe, expect, test, vi } from "vitest";
import { makeFixtureUser } from "@/contracts";

const hoisted = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  redirect: vi.fn((_path: string) => {
    throw new Error("__redirect__");
  }),
}));

vi.mock("@/services/team-01-auth", () => ({
  getCurrentUser: (...a: unknown[]) => hoisted.getCurrentUser(...a),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => hoisted.redirect(path),
}));

import { requireAdmin } from "@/lib/admin/auth";

beforeEach(() => {
  hoisted.getCurrentUser.mockReset();
  hoisted.redirect.mockClear();
});

describe("requireAdmin", () => {
  test("redirects anonymous viewers to /login", async () => {
    hoisted.getCurrentUser.mockResolvedValue(null);
    await expect(requireAdmin()).rejects.toThrow("__redirect__");
    expect(hoisted.redirect).toHaveBeenCalledWith("/login");
  });

  test("redirects non-admin viewers to /", async () => {
    hoisted.getCurrentUser.mockResolvedValue(
      makeFixtureUser({ id: "u_1", role: "buyer" }),
    );
    await expect(requireAdmin()).rejects.toThrow("__redirect__");
    expect(hoisted.redirect).toHaveBeenCalledWith("/");
  });

  test("returns the user when role is admin", async () => {
    const admin = makeFixtureUser({ id: "admin_1", role: "admin" });
    hoisted.getCurrentUser.mockResolvedValue(admin);
    await expect(requireAdmin()).resolves.toEqual(admin);
    expect(hoisted.redirect).not.toHaveBeenCalled();
  });
});
