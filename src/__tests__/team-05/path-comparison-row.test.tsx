// @vitest-environment jsdom
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeFixturePathQuote } from "@/contracts";
import { PathComparisonRow } from "@/components/compare/path-comparison-row";

describe("PathComparisonRow", () => {
  test("renders one row per path in canonical order", () => {
    const quotes = [
      makeFixturePathQuote({ path: "dealer", total: 24000, monthly: 450, apr: 0.195, term: "5y", down: 2400 }),
      makeFixturePathQuote({ path: "auction", total: 13000 }),
      makeFixturePathQuote({ path: "picknbuild", total: 22000, biweekly: 180, term: "3y", down: 3500 }),
      makeFixturePathQuote({ path: "private", total: 12000 }),
    ];
    render(<PathComparisonRow quotes={quotes} />);
    expect(screen.getByTestId("path-row-dealer")).toBeTruthy();
    expect(screen.getByTestId("path-row-auction")).toBeTruthy();
    expect(screen.getByTestId("path-row-picknbuild")).toBeTruthy();
    expect(screen.getByTestId("path-row-private")).toBeTruthy();
  });

  test("dealer row shows monthly cadence + APR + term cells", () => {
    const quotes = [
      makeFixturePathQuote({
        path: "dealer",
        total: 24000,
        monthly: 450,
        apr: 0.195,
        term: "5y",
        down: 2400,
      }),
    ];
    render(<PathComparisonRow quotes={quotes} />);
    const row = screen.getByTestId("path-row-dealer");
    const cells = Array.from(row.querySelectorAll("td")).map((td) => td.textContent ?? "");
    expect(cells[0]).toContain("$24,000");
    expect(cells[1]).toContain("$2,400");
    expect(cells[2]).toContain("$450/mo");
    expect(cells[3]).toContain("19.5%");
    expect(cells[4]).toContain("5 yr");
  });

  test("picknbuild row shows biweekly cadence", () => {
    const quotes = [
      makeFixturePathQuote({
        path: "picknbuild",
        total: 22000,
        biweekly: 180,
        term: "3y",
        down: 3500,
      }),
    ];
    render(<PathComparisonRow quotes={quotes} />);
    const row = screen.getByTestId("path-row-picknbuild");
    expect((row.textContent ?? "").includes("$180 biweekly")).toBe(true);
  });

  test("marks best-fit row when bestFitPath is passed", () => {
    const quotes = [
      makeFixturePathQuote({ path: "dealer", total: 24000 }),
      makeFixturePathQuote({ path: "picknbuild", total: 22000, biweekly: 180, term: "3y" }),
    ];
    render(<PathComparisonRow quotes={quotes} bestFitPath="picknbuild" />);
    expect(
      screen.getByTestId("path-row-picknbuild").getAttribute("data-best-fit"),
    ).toBe("true");
    expect(
      screen.getByTestId("path-row-dealer").getAttribute("data-best-fit"),
    ).toBe("false");
  });

  test("dealer not-approved renders 'Not approved' in the all-in cell", () => {
    const quotes = [
      makeFixturePathQuote({ path: "dealer", approvedBool: false, total: 24000 }),
    ];
    render(<PathComparisonRow quotes={quotes} />);
    expect(
      (screen.getByTestId("path-row-dealer").textContent ?? "").includes(
        "Not approved",
      ),
    ).toBe(true);
  });

  test("missing paths render '—' placeholders", () => {
    const quotes = [makeFixturePathQuote({ path: "picknbuild" })];
    render(<PathComparisonRow quotes={quotes} />);
    const dealerRow = screen.getByTestId("path-row-dealer");
    expect((dealerRow.textContent ?? "").includes("—")).toBe(true);
  });
});
