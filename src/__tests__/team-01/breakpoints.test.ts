import { describe, expect, test } from "vitest";
import {
  BREAKPOINTS,
  isMobileWidth,
  resolveBreakpoint,
} from "@/lib/responsive/breakpoints";

describe("resolveBreakpoint", () => {
  test("0 → xs", () => expect(resolveBreakpoint(0)).toBe("xs"));
  test("479 → xs", () => expect(resolveBreakpoint(479)).toBe("xs"));
  test("480 → sm", () => expect(resolveBreakpoint(BREAKPOINTS.sm)).toBe("sm"));
  test("767 → sm", () => expect(resolveBreakpoint(767)).toBe("sm"));
  test("768 → md", () => expect(resolveBreakpoint(BREAKPOINTS.md)).toBe("md"));
  test("1023 → md", () => expect(resolveBreakpoint(1023)).toBe("md"));
  test("1024 → lg", () => expect(resolveBreakpoint(BREAKPOINTS.lg)).toBe("lg"));
  test("1280 → xl", () => expect(resolveBreakpoint(BREAKPOINTS.xl)).toBe("xl"));
  test("4000 → xl (clamped)", () => expect(resolveBreakpoint(4000)).toBe("xl"));
});

describe("isMobileWidth", () => {
  test("anything below md is mobile", () => {
    expect(isMobileWidth(0)).toBe(true);
    expect(isMobileWidth(BREAKPOINTS.md - 1)).toBe(true);
  });
  test("md and up is not mobile", () => {
    expect(isMobileWidth(BREAKPOINTS.md)).toBe(false);
    expect(isMobileWidth(BREAKPOINTS.lg)).toBe(false);
  });
});
