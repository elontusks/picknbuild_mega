// @vitest-environment jsdom
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeFixtureListingObject } from "@/contracts";
import { VehicleCard } from "@/components/vehicles/vehicle-card";

describe("VehicleCard", () => {
  test("renders year/make/model/trim title line", () => {
    const listing = makeFixtureListingObject({
      year: 2020,
      make: "Toyota",
      model: "Tacoma",
      trim: "TRD Off-Road",
    });
    render(<VehicleCard listing={listing} />);
    expect(
      screen.getByRole("heading", { level: 3, name: /2020 Toyota Tacoma TRD Off-Road/ }),
    ).toBeTruthy();
  });

  test("clean title renders 'Clean' chip", () => {
    const listing = makeFixtureListingObject({ titleStatus: "clean" });
    render(<VehicleCard listing={listing} />);
    expect(screen.getByTestId("title-chip").textContent).toBe("Clean");
  });

  test("rebuilt title renders 'Rebuilt' chip", () => {
    const listing = makeFixtureListingObject({ titleStatus: "rebuilt" });
    render(<VehicleCard listing={listing} />);
    expect(screen.getByTestId("title-chip").textContent).toBe("Rebuilt");
  });

  test("unknown title renders fallback chip", () => {
    const listing = makeFixtureListingObject({ titleStatus: "unknown" });
    render(<VehicleCard listing={listing} />);
    expect(screen.getByTestId("title-chip").textContent).toBe("Title unknown");
  });

  test("auction listings lead with current bid when present", () => {
    const listing = makeFixtureListingObject({
      source: "copart",
      price: undefined,
      currentBid: 8500,
      binPrice: 11000,
    });
    render(<VehicleCard listing={listing} />);
    expect(screen.getByTestId("price").textContent).toBe("$8,500");
  });

  test("auction listings fall back to BIN if no current bid", () => {
    const listing = makeFixtureListingObject({
      source: "iaai",
      price: undefined,
      currentBid: undefined,
      binPrice: 12300,
    });
    render(<VehicleCard listing={listing} />);
    expect(screen.getByTestId("price").textContent).toBe("$12,300");
  });

  test("dealer/private listings lead with ask price", () => {
    const listing = makeFixtureListingObject({
      source: "dealer",
      price: 18500,
    });
    render(<VehicleCard listing={listing} />);
    expect(screen.getByTestId("price").textContent).toBe("$18,500");
  });

  test("missing price renders em-dash", () => {
    const listing = makeFixtureListingObject({
      source: "user",
      price: undefined,
      currentBid: undefined,
      binPrice: undefined,
    });
    render(<VehicleCard listing={listing} />);
    expect(screen.getByTestId("price").textContent).toBe("—");
  });

  test("missing photos renders no-photo placeholder", () => {
    const listing = makeFixtureListingObject({ photos: [] });
    render(<VehicleCard listing={listing} />);
    expect(screen.getByText(/no photo yet/i)).toBeTruthy();
  });

  test("distance renders miles when both ZIPs are known", () => {
    const listing = makeFixtureListingObject({ locationZip: "44114" });
    render(<VehicleCard listing={listing} userZip="43210" />);
    expect(screen.getByTestId("distance").textContent).toMatch(/mi$/);
    expect(screen.getByTestId("distance").textContent).not.toBe("— mi");
  });

  test("distance falls back to em-dash when either ZIP is unknown", () => {
    const listing = makeFixtureListingObject({ locationZip: "00000" });
    render(<VehicleCard listing={listing} userZip="43210" />);
    expect(screen.getByTestId("distance").textContent).toBe("— mi");
  });

  test("risk tier chip renders when provided", () => {
    const listing = makeFixtureListingObject();
    render(<VehicleCard listing={listing} riskTier="high" />);
    expect(screen.getByTestId("risk-chip").textContent).toBe("High risk");
  });

  test("risk tier chip is omitted by default", () => {
    const listing = makeFixtureListingObject();
    render(<VehicleCard listing={listing} />);
    expect(screen.queryByTestId("risk-chip")).toBeNull();
  });

  test("stale/removed status badge renders when status is not active", () => {
    const listing = makeFixtureListingObject({ status: "stale" });
    render(<VehicleCard listing={listing} />);
    expect(screen.getByText("Stale")).toBeTruthy();
  });

  test("variant attribute is exposed for analytics", () => {
    const listing = makeFixtureListingObject();
    render(<VehicleCard listing={listing} variant="feed" />);
    expect(screen.getByTestId("vehicle-card").getAttribute("data-variant")).toBe(
      "feed",
    );
  });

  test("source label is rendered for each source", () => {
    const cases = [
      { source: "copart", label: "Copart" },
      { source: "iaai", label: "IAAI" },
      { source: "craigslist", label: "Craigslist" },
      { source: "dealer", label: "Dealer" },
      { source: "user", label: "Private seller" },
      { source: "parsed-link", label: "External link" },
    ] as const;
    for (const { source, label } of cases) {
      const listing = makeFixtureListingObject({ source });
      const { unmount } = render(<VehicleCard listing={listing} />);
      expect(screen.getByText(label)).toBeTruthy();
      unmount();
    }
  });
});
