import { describe, expect, test } from "vitest";
import {
  DISCLAIMER_KEYS,
  getDisclaimer,
  listDisclaimers,
} from "@/lib/legal/disclaimers";

describe("legal disclaimer library", () => {
  test("exposes all keys named in COMPONENTS.md", () => {
    expect(DISCLAIMER_KEYS).toEqual(
      expect.arrayContaining([
        "estimate",
        "financing",
        "non-refundable",
        "insurance",
        "clean-vs-rebuilt",
      ]),
    );
  });

  test("getDisclaimer returns non-empty copy for every key", () => {
    for (const key of DISCLAIMER_KEYS) {
      const copy = getDisclaimer(key);
      expect(copy.length).toBeGreaterThan(20);
    }
  });

  test("non-refundable disclaimer includes the deposit dollar amount", () => {
    expect(getDisclaimer("non-refundable")).toMatch(/\$1,000/);
  });

  test("auction disclaimer states picknbuild does not bid", () => {
    expect(getDisclaimer("auction-diy").toLowerCase()).toContain("not bid");
  });

  test("listDisclaimers returns one entry per key", () => {
    expect(listDisclaimers()).toHaveLength(DISCLAIMER_KEYS.length);
  });
});
