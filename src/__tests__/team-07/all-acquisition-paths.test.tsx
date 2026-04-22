// @vitest-environment jsdom
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeFixturePathQuote } from "@/contracts";
import { AllAcquisitionPaths } from "@/components/vehicles/all-acquisition-paths";

const quoteFor = (
  overrides: Parameters<typeof makeFixturePathQuote>[0] = {},
) => makeFixturePathQuote(overrides);

describe("AllAcquisitionPaths", () => {
  test("renders one card per path in the canonical order", () => {
    const quotes = [
      quoteFor({ path: "dealer", total: 24000, monthly: 420, apr: 0.195 }),
      quoteFor({ path: "auction", total: 13200, down: undefined }),
      quoteFor({ path: "picknbuild", total: 21000, biweekly: 180, term: "3y" }),
      quoteFor({ path: "private", total: 12500, down: undefined }),
    ];
    render(<AllAcquisitionPaths quotes={quotes} listingId="l1" />);
    expect(screen.getByTestId("path-card-dealer")).toBeTruthy();
    expect(screen.getByTestId("path-card-auction")).toBeTruthy();
    expect(screen.getByTestId("path-card-picknbuild")).toBeTruthy();
    expect(screen.getByTestId("path-card-private")).toBeTruthy();
  });

  test("each card shows PathQuote.barrierLine verbatim (all-in rule)", () => {
    const quotes = [
      quoteFor({ path: "dealer", barrierLine: "Dealer barrier X" }),
      quoteFor({ path: "auction", barrierLine: "Auction barrier Y" }),
      quoteFor({ path: "picknbuild", barrierLine: "picknbuild barrier Z" }),
      quoteFor({ path: "private", barrierLine: "Private barrier Q" }),
    ];
    render(<AllAcquisitionPaths quotes={quotes} listingId="l1" />);
    expect(screen.getByTestId("barrier-dealer").textContent).toBe(
      "Dealer barrier X",
    );
    expect(screen.getByTestId("barrier-auction").textContent).toBe(
      "Auction barrier Y",
    );
    expect(screen.getByTestId("barrier-picknbuild").textContent).toBe(
      "picknbuild barrier Z",
    );
    expect(screen.getByTestId("barrier-private").textContent).toBe(
      "Private barrier Q",
    );
  });

  test("renders 'not approved' badge for dealer when approvedBool is false", () => {
    const quotes = [
      quoteFor({ path: "dealer", approvedBool: false }),
      quoteFor({ path: "auction" }),
      quoteFor({ path: "picknbuild" }),
      quoteFor({ path: "private" }),
    ];
    render(<AllAcquisitionPaths quotes={quotes} listingId="l1" />);
    expect(screen.getByTestId("not-approved")).toBeTruthy();
  });

  test("does not render 'not approved' for non-dealer paths", () => {
    const quotes = [
      quoteFor({ path: "dealer", approvedBool: true }),
      quoteFor({ path: "auction" }),
      quoteFor({ path: "picknbuild" }),
      quoteFor({ path: "private" }),
    ];
    render(<AllAcquisitionPaths quotes={quotes} listingId="l1" />);
    expect(screen.queryByTestId("not-approved")).toBeNull();
  });

  test("bestFit badge highlights exactly one card", () => {
    const quotes = [
      quoteFor({ path: "dealer" }),
      quoteFor({ path: "auction" }),
      quoteFor({ path: "picknbuild" }),
      quoteFor({ path: "private" }),
    ];
    render(
      <AllAcquisitionPaths quotes={quotes} listingId="l1" bestFitPath="picknbuild" />,
    );
    expect(screen.getAllByText(/best fit/i)).toHaveLength(1);
  });

  test("shows picknbuild biweekly + term when provided (all-in rule)", () => {
    const quotes = [
      quoteFor({ path: "picknbuild", total: 22000, biweekly: 185, term: "3y" }),
    ];
    render(<AllAcquisitionPaths quotes={quotes} listingId="l1" />);
    const card = screen.getByTestId("path-card-picknbuild");
    expect(card.textContent).toContain("$22,000");
    expect(card.textContent).toContain("$185 biweekly");
    expect(card.textContent).toContain("3 yr");
  });

  test("shows dealer monthly + APR when provided", () => {
    const quotes = [
      quoteFor({
        path: "dealer",
        total: 28000,
        monthly: 520,
        apr: 0.195,
        term: "5y",
      }),
    ];
    render(<AllAcquisitionPaths quotes={quotes} listingId="l1" />);
    const card = screen.getByTestId("path-card-dealer");
    expect(card.textContent).toContain("$28,000");
    expect(card.textContent).toContain("$520/mo");
    expect(card.textContent).toContain("19.5% APR");
  });

  test("is resilient to missing paths (only renders what it has)", () => {
    const quotes = [quoteFor({ path: "picknbuild" })];
    render(<AllAcquisitionPaths quotes={quotes} listingId="l1" />);
    expect(screen.getByTestId("path-card-picknbuild")).toBeTruthy();
    expect(screen.queryByTestId("path-card-dealer")).toBeNull();
  });
});
