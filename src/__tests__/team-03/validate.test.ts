import { describe, expect, test } from "vitest";
import { validateListingForm } from "@/lib/listings/validate";

describe("validateListingForm", () => {
  const base = { year: 2019, make: "Honda", model: "Accord" };

  test("accepts a minimal form", () => {
    const r = validateListingForm(base);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.titleStatus).toBe("unknown");
      expect(r.value.photos).toEqual([]);
    }
  });

  test("rejects bogus year", () => {
    expect(validateListingForm({ ...base, year: 1800 }).ok).toBe(false);
    expect(validateListingForm({ ...base, year: "abc" }).ok).toBe(false);
  });

  test("rejects missing make or model", () => {
    expect(validateListingForm({ ...base, make: "" }).ok).toBe(false);
    expect(validateListingForm({ ...base, model: "   " }).ok).toBe(false);
  });

  test("rejects negative mileage", () => {
    expect(validateListingForm({ ...base, mileage: -1 }).ok).toBe(false);
  });

  test("rejects negative price", () => {
    expect(validateListingForm({ ...base, price: -1 }).ok).toBe(false);
  });

  test("rejects malformed VIN", () => {
    const r = validateListingForm({ ...base, vin: "short" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.field).toBe("vin");
  });

  test("accepts valid 17-char VIN and uppercases it", () => {
    const r = validateListingForm({ ...base, vin: "1hgcv1f30la012345" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.vin).toBe("1HGCV1F30LA012345");
  });

  test("rejects ZIP that isn't 5 digits", () => {
    expect(validateListingForm({ ...base, locationZip: "1234" }).ok).toBe(false);
    expect(validateListingForm({ ...base, locationZip: "43210" }).ok).toBe(true);
  });

  test("rejects malformed sourceUrl", () => {
    const r = validateListingForm({ ...base, sourceUrl: "not-a-url" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.field).toBe("sourceUrl");
  });

  test("trims whitespace from free-text fields", () => {
    const r = validateListingForm({
      ...base,
      make: "  Honda  ",
      model: " Accord ",
      trim: "  Sport ",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.make).toBe("Honda");
      expect(r.value.model).toBe("Accord");
      expect(r.value.trim).toBe("Sport");
    }
  });

  test("normalizes photos (dedup empty entries)", () => {
    const r = validateListingForm({
      ...base,
      photos: ["https://cdn/a.jpg", "", " https://cdn/b.jpg "],
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.photos).toEqual(["https://cdn/a.jpg", "https://cdn/b.jpg"]);
  });
});
