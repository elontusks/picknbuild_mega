import { describe, expect, test } from "vitest";
import {
  buildPrivatePathQuote,
  computePrivateQuote,
} from "@/lib/pricing/private-quote";

describe("computePrivateQuote", () => {
  test("total = ask + tax + transfer fees", () => {
    const q = computePrivateQuote({
      listing: { price: 10000, titleStatus: "clean" },
      tax: 700,
      transferFees: 85,
    });
    expect(q.total).toBe(10785);
  });

  test("defaults tax to 7% of ask", () => {
    const q = computePrivateQuote({
      listing: { price: 10000, titleStatus: "clean" },
    });
    expect(q.tax).toBe(700);
  });

  test("handles missing price gracefully", () => {
    const q = computePrivateQuote({
      listing: { titleStatus: "clean" },
    });
    expect(q.ask).toBe(0);
    expect(q.total).toBe(85); // just default transfer
  });
});

describe("buildPrivatePathQuote", () => {
  test("no financing fields", () => {
    const q = buildPrivatePathQuote({
      listing: { price: 10000, titleStatus: "clean" },
    });
    expect(q.path).toBe("private");
    expect(q.down).toBeUndefined();
    expect(q.monthly).toBeUndefined();
    expect(q.biweekly).toBeUndefined();
    expect(q.apr).toBeUndefined();
  });
});
