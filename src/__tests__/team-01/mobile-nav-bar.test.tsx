// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/garage",
}));

import { MobileNavBar } from "@/components/shell/mobile-nav-bar";

describe("MobileNavBar", () => {
  test("renders hamburger button", () => {
    render(<MobileNavBar />);
    const button = screen.getByLabelText("Toggle navigation menu");
    expect(button).toBeTruthy();
  });

  test("shows menu items when hamburger button is clicked", () => {
    render(<MobileNavBar />);

    const button = screen.getByLabelText("Toggle navigation menu");
    fireEvent.click(button);

    for (const label of ["Browse", "Garage", "Feed", "Inbox", "Profile"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  test("marks the matching pathname as active", () => {
    render(<MobileNavBar />);

    const button = screen.getByLabelText("Toggle navigation menu");
    fireEvent.click(button);

    const garage = screen.getByText("Garage").closest("a")!;
    expect(garage.getAttribute("aria-current")).toBe("page");
    expect(garage.getAttribute("data-active")).toBe("true");

    const browse = screen.getByText("Browse").closest("a")!;
    expect(browse.getAttribute("aria-current")).toBeNull();
    expect(browse.getAttribute("data-active")).toBe("false");
  });

  test("closes menu when a link is clicked", () => {
    render(<MobileNavBar />);

    const button = screen.getByLabelText("Toggle navigation menu");
    fireEvent.click(button);

    const browseLink = screen.getByText("Browse").closest("a")!;
    expect(button.getAttribute("aria-expanded")).toBe("true");

    fireEvent.click(browseLink);
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });

  test("closes menu when backdrop is clicked", () => {
    const { container } = render(<MobileNavBar />);

    const button = screen.getByLabelText("Toggle navigation menu");
    fireEvent.click(button);

    const backdrop = container.querySelector("[aria-hidden='true']");
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop!);

    expect(button.getAttribute("aria-expanded")).toBe("false");
  });
});
