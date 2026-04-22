import { describe, expect, test } from "vitest";
import {
  buildDealerPathQuote,
  computeDealerApr,
} from "@/lib/pricing/dealer-quote";

describe("computeDealerApr", () => {
  test("prime tier (720+) = 12% APR", () => {
    const q = computeDealerApr({
      creditScore: 750,
      listingPrice: 20000,
      term: "5y",
    });
    expect(q.apr).toBe(0.12);
    expect(q.approvedBool).toBe(true);
    expect(q.monthly).toBeGreaterThan(0);
  });

  test("near-prime (621-719) = 19.5% APR", () => {
    const q = computeDealerApr({
      creditScore: 680,
      listingPrice: 20000,
      term: "5y",
    });
    expect(q.apr).toBe(0.195);
  });

  test("subprime (0-620) = 27% APR", () => {
    const q = computeDealerApr({
      creditScore: 600,
      listingPrice: 20000,
      term: "5y",
    });
    expect(q.apr).toBe(0.27);
    expect(q.approvedBool).toBe(true); // still approved at 600 (≥580 threshold)
  });

  test("noCredit = not approved, zero monthly", () => {
    const q = computeDealerApr({
      noCredit: true,
      listingPrice: 20000,
      term: "5y",
    });
    expect(q.approvedBool).toBe(false);
    expect(q.monthly).toBe(0);
  });

  test("score below 580 = not approved", () => {
    const q = computeDealerApr({
      creditScore: 500,
      listingPrice: 20000,
      term: "5y",
    });
    expect(q.approvedBool).toBe(false);
    expect(q.monthly).toBe(0);
  });

  test("cash term = no financing numbers", () => {
    const q = computeDealerApr({
      creditScore: 750,
      listingPrice: 20000,
      term: "cash",
    });
    expect(q.monthly).toBe(0);
    expect(q.apr).toBe(0);
    expect(q.financedAmount).toBe(0);
  });

  test("total includes tax and fees", () => {
    const q = computeDealerApr({
      creditScore: 750,
      listingPrice: 20000,
      tax: 1500,
      fees: 600,
      term: "cash",
    });
    expect(q.total).toBe(22100);
  });

  test("changing term updates monthly (APR remains tier)", () => {
    const short = computeDealerApr({
      creditScore: 750,
      listingPrice: 20000,
      term: "3y",
    });
    const long = computeDealerApr({
      creditScore: 750,
      listingPrice: 20000,
      term: "5y",
    });
    expect(short.monthly).toBeGreaterThan(long.monthly);
    expect(short.apr).toBe(long.apr);
  });

  test("total paid ≥ total (interest > 0 on financed)", () => {
    const q = computeDealerApr({
      creditScore: 750,
      listingPrice: 20000,
      term: "5y",
    });
    expect(q.totalPaid).toBeGreaterThan(q.total);
    expect(q.interestPaid).toBeGreaterThan(0);
  });

  test("trade-in reduces total", () => {
    const withTrade = computeDealerApr({
      creditScore: 750,
      listingPrice: 20000,
      tradeInValue: 4000,
      term: "cash",
    });
    const without = computeDealerApr({
      creditScore: 750,
      listingPrice: 20000,
      term: "cash",
    });
    expect(withTrade.total).toBe(without.total - 4000);
  });
});

describe("buildDealerPathQuote", () => {
  test("No Credit surfaces 'Most likely not approved' barrier", () => {
    const q = buildDealerPathQuote({
      noCredit: true,
      listingPrice: 20000,
      term: "5y",
    });
    expect(q.approvedBool).toBe(false);
    expect(q.barrierLine.toLowerCase()).toContain("not approved");
  });

  test("cash term omits monthly/apr/down", () => {
    const q = buildDealerPathQuote({
      creditScore: 750,
      listingPrice: 20000,
      term: "cash",
    });
    expect(q.monthly).toBeUndefined();
    expect(q.apr).toBeUndefined();
    expect(q.down).toBeUndefined();
  });

  test("financed term publishes monthly, apr, and down", () => {
    const q = buildDealerPathQuote({
      creditScore: 750,
      listingPrice: 20000,
      term: "5y",
    });
    expect(q.monthly).toBeDefined();
    expect(q.apr).toBe(0.12);
    expect(q.down).toBeGreaterThan(0);
  });

  test("titleStatus is forwarded", () => {
    const q = buildDealerPathQuote({
      creditScore: 750,
      listingPrice: 20000,
      titleStatus: "rebuilt",
      term: "5y",
    });
    expect(q.titleStatus).toBe("rebuilt");
  });
});
