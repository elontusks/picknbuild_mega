import { describe, expect, test } from "vitest";
import {
  isFinancedTerm,
  termToBiweeklyCount,
  termToMonths,
} from "@/lib/pricing/term-cadence";

describe("termToBiweeklyCount", () => {
  test("matches the 26/52/78/104/130 table", () => {
    expect(termToBiweeklyCount("1y")).toBe(26);
    expect(termToBiweeklyCount("2y")).toBe(52);
    expect(termToBiweeklyCount("3y")).toBe(78);
    expect(termToBiweeklyCount("4y")).toBe(104);
    expect(termToBiweeklyCount("5y")).toBe(130);
  });
});

describe("termToMonths", () => {
  test("converts year strings to months", () => {
    expect(termToMonths("1y")).toBe(12);
    expect(termToMonths("3y")).toBe(36);
    expect(termToMonths("5y")).toBe(60);
  });
});

describe("isFinancedTerm", () => {
  test("cash and undefined are not financed", () => {
    expect(isFinancedTerm("cash")).toBe(false);
    expect(isFinancedTerm(undefined)).toBe(false);
  });
  test("year terms are financed", () => {
    expect(isFinancedTerm("1y")).toBe(true);
    expect(isFinancedTerm("5y")).toBe(true);
  });
});
