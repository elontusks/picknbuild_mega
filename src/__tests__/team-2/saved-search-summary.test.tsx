// @vitest-environment jsdom
import { beforeEach, describe, expect, test } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { SavedSearchSummary } from "@/components/profiles/saved-search-summary";

const STORAGE_KEY = "picknbuild:intake:v1:user_a";

describe("SavedSearchSummary", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("shows empty state and Search link when no persisted intake", async () => {
    await act(async () => {
      render(<SavedSearchSummary userId="user_a" />);
    });
    expect(screen.getByTestId("saved-search-empty")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /start a search/i }),
    ).toBeTruthy();
  });

  test("renders a chip per intake facet when persisted", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        state: {
          location: { zip: "43210" },
          make: "Toyota",
          model: "Tacoma",
          yearRange: [2018, 2022],
          mileageMax: 80000,
          cash: 5000,
          creditScore: 680,
          noCredit: false,
          titlePreference: "clean",
          matchMode: true,
        },
      }),
    );

    await act(async () => {
      render(<SavedSearchSummary userId="user_a" />);
    });
    const pane = screen.getByTestId("saved-search");
    expect(pane.textContent).toContain("Toyota Tacoma");
    expect(pane.textContent).toContain("2018–2022");
    expect(pane.textContent).toContain("80,000");
    expect(pane.textContent).toContain("Clean only");
    expect(pane.textContent).toContain("Credit 680");
    expect(pane.textContent).toContain("Cash $5,000");
    expect(pane.textContent).toContain("Match mode");
  });
});
