// @vitest-environment jsdom
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeFixtureDealRecord } from "@/contracts";
import { PostConversionStatusView } from "@/components/dashboard/post-conversion-status-view";
import { getDisclaimer } from "@/lib/legal/disclaimers";

describe("PostConversionStatusView", () => {
  test("renders the picknbuild build-started flow for a DealRecord on the build path", () => {
    const deal = makeFixtureDealRecord({
      id: "d_1",
      status: "purchased",
      committedSpec: {
        makeModelYearRange: "2020 Honda Accord",
        mileageRange: "40-70k",
        titleType: "clean",
        customizations: [],
        attachments: [],
      },
    });
    render(
      <PostConversionStatusView deal={deal} conversionState="post-deposit" />,
    );
    const picknbuild = screen.getByTestId("post-conversion-picknbuild");
    expect(picknbuild).toBeTruthy();
    expect(
      screen.getByTestId("post-conversion-current-status").dataset["status"],
    ).toBe("purchased");
    const stages = screen.getAllByTestId("post-conversion-stage");
    expect(stages.map((s) => s.dataset["stage"])).toEqual([
      "build-started",
      "sourcing",
      "purchased",
      "in-transit",
      "delivered",
    ]);
    const active = stages.find((s) => s.dataset["state"] === "active");
    expect(active?.dataset["stage"]).toBe("purchased");
  });

  test("renders the DIY auction handoff copy for an auction-path conversion", () => {
    const deal = makeFixtureDealRecord({
      id: "d_auction",
      // Marker used by isAuctionDeal: `path:auction` in the customizations
      // list or an `auction-*` attachment. Production Team 12 work can move
      // this off the committedSpec; today it's the only available signal.
      committedSpec: {
        makeModelYearRange: "2018 Toyota Tacoma",
        mileageRange: "60-90k",
        titleType: "clean",
        customizations: ["path:auction"],
        attachments: [],
      },
    });
    render(<PostConversionStatusView deal={deal} conversionState={null} />);
    expect(screen.getByTestId("post-conversion-auction")).toBeTruthy();
    expect(screen.getByText(getDisclaimer("auction-diy"))).toBeTruthy();
    expect(screen.queryByTestId("post-conversion-picknbuild")).toBeNull();
  });
});
