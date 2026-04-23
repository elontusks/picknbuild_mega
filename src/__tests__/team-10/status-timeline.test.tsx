// @vitest-environment jsdom
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusTimeline } from "@/components/dashboard/status-timeline";

describe("StatusTimeline", () => {
  test("renders every DealRecord.timeline entry in occurredAt order", () => {
    render(
      <StatusTimeline
        timeline={[
          { stage: "sourcing", occurredAt: "2026-02-01T00:00:00.000Z" },
          { stage: "build-started", occurredAt: "2026-01-01T00:00:00.000Z" },
          { stage: "purchased", occurredAt: "2026-03-01T00:00:00.000Z" },
        ]}
      />,
    );
    const rows = screen.getAllByTestId("status-timeline-entry");
    expect(rows.map((r) => r.dataset["stage"])).toEqual([
      "build-started",
      "sourcing",
      "purchased",
    ]);
  });

  test("humanizes known DealStatus stages", () => {
    render(
      <StatusTimeline
        timeline={[
          { stage: "in-transit", occurredAt: "2026-04-01T00:00:00.000Z" },
        ]}
      />,
    );
    expect(screen.getByText(/In transit/)).toBeTruthy();
  });
});
