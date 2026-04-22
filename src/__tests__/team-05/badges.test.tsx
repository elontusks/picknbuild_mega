// @vitest-environment jsdom
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  BestFitBadge,
  RiskBadge,
  TitleBadge,
} from "@/components/compare/badges";

describe("TitleBadge", () => {
  test("clean renders 'Clean'", () => {
    render(<TitleBadge status="clean" />);
    expect(screen.getByTestId("title-badge").textContent).toBe("Clean");
  });
  test("rebuilt renders 'Rebuilt'", () => {
    render(<TitleBadge status="rebuilt" />);
    expect(screen.getByTestId("title-badge").textContent).toBe("Rebuilt");
  });
  test("unknown renders 'Unknown'", () => {
    render(<TitleBadge status="unknown" />);
    expect(screen.getByTestId("title-badge").textContent).toBe("Unknown");
  });
});

describe("RiskBadge", () => {
  test("700+ credit renders low risk", () => {
    render(<RiskBadge creditScore={720} />);
    const badge = screen.getByTestId("risk-badge");
    expect(badge.getAttribute("data-risk-level")).toBe("low");
    expect(badge.textContent).toBe("Low risk");
  });
  test("620-699 credit renders medium risk", () => {
    render(<RiskBadge creditScore={650} />);
    expect(screen.getByTestId("risk-badge").getAttribute("data-risk-level")).toBe(
      "med",
    );
  });
  test("sub-620 credit renders high risk", () => {
    render(<RiskBadge creditScore={580} />);
    expect(screen.getByTestId("risk-badge").getAttribute("data-risk-level")).toBe(
      "high",
    );
  });
  test("noCredit forces high risk regardless of score", () => {
    render(<RiskBadge creditScore={820} noCredit />);
    expect(screen.getByTestId("risk-badge").getAttribute("data-risk-level")).toBe(
      "high",
    );
  });
  test("undefined credit forces high risk", () => {
    render(<RiskBadge />);
    expect(screen.getByTestId("risk-badge").getAttribute("data-risk-level")).toBe(
      "high",
    );
  });
});

describe("BestFitBadge", () => {
  test("renders the 'Best fit' label", () => {
    render(<BestFitBadge />);
    expect(screen.getByTestId("best-fit-badge").textContent).toBe("Best fit");
  });
});
