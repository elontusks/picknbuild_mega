import { describe, expect, test } from "vitest";
import {
  buildAuctionPathQuote,
  computeAuctionQuote,
} from "@/lib/pricing/auction-quote";

describe("computeAuctionQuote", () => {
  test("total includes bid + buyer fee + transport + repair buffer", () => {
    const q = computeAuctionQuote({
      listing: {
        currentBid: 10000,
        fees: 1200,
        titleStatus: "clean",
      },
    });
    // 10000 + 1200 + default transport 900 + default repairs 1500
    expect(q.total).toBe(10000 + 1200 + 900 + 1500);
  });

  test("defaults buyer fee to 12% of bid when listing.fees missing", () => {
    const q = computeAuctionQuote({
      listing: { currentBid: 10000, titleStatus: "clean" },
    });
    expect(q.buyerFee).toBe(1200);
  });

  test("prefers binPrice over currentBid when present", () => {
    const q = computeAuctionQuote({
      listing: { currentBid: 10000, binPrice: 14000, titleStatus: "clean" },
    });
    expect(q.bid).toBe(14000);
  });

  test("accepts overrides for transport and repair buffer", () => {
    const q = computeAuctionQuote({
      listing: { currentBid: 10000, titleStatus: "clean" },
      transportEstimate: 400,
      repairBuffer: 0,
    });
    expect(q.transport).toBe(400);
    expect(q.repairBuffer).toBe(0);
  });
});

describe("buildAuctionPathQuote", () => {
  test("PathQuote has no down/monthly/biweekly", () => {
    const q = buildAuctionPathQuote({
      listing: { currentBid: 10000, titleStatus: "clean" },
    });
    expect(q.path).toBe("auction");
    expect(q.down).toBeUndefined();
    expect(q.monthly).toBeUndefined();
    expect(q.biweekly).toBeUndefined();
    expect(q.apr).toBeUndefined();
    expect(q.barrierLine).toMatch(/cash/i);
  });
});
