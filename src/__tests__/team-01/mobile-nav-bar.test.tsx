// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/garage",
}));

import { MobileNavBar } from "@/components/shell/mobile-nav-bar";

describe("MobileNavBar", () => {
  test("renders the four primary tabs", () => {
    render(<MobileNavBar />);
    for (const label of ["Search", "Garage", "Inbox", "Profile"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  test("marks the matching pathname as active", () => {
    render(<MobileNavBar />);
    const garage = screen.getByText("Garage").closest("a")!;
    expect(garage.getAttribute("aria-current")).toBe("page");
    expect(garage.getAttribute("data-active")).toBe("true");

    const search = screen.getByText("Search").closest("a")!;
    expect(search.getAttribute("aria-current")).toBeNull();
    expect(search.getAttribute("data-active")).toBe("false");
  });
});
