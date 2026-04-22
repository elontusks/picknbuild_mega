import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  makeFixtureAgreementDocument,
  makeFixtureBuildRecord,
  makeFixtureUser,
} from "@/contracts";

// In-memory storage for team-15-storage so we can observe Team 9's writes to
// bucket "build_records" + "agreements" without hitting Supabase.
type Bucket = Map<string, unknown>;
const buckets = new Map<string, Bucket>();
const getBucket = (name: string): Bucket => {
  if (!buckets.has(name)) buckets.set(name, new Map());
  return buckets.get(name)!;
};

const hoisted = vi.hoisted(() => ({
  requireUser: vi.fn(),
  createDepositCharge: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn((_path: string) => {
    throw new Error("__redirect__");
  }),
  headersGet: vi.fn((_key: string) => null as string | null),
}));

vi.mock("@/services/team-01-auth", () => ({
  requireUser: (...a: unknown[]) => hoisted.requireUser(...a),
}));

vi.mock("@/services/team-14-payments", () => ({
  createDepositCharge: (...a: unknown[]) => hoisted.createDepositCharge(...a),
}));

vi.mock("@/services/team-15-storage", () => ({
  putRecord: vi.fn(async (bucket: string, id: string, value: unknown) => {
    getBucket(bucket).set(id, value);
  }),
  getRecord: vi.fn(async (bucket: string, id: string) =>
    getBucket(bucket).get(id) ?? null,
  ),
  listRecords: vi.fn(async (bucket: string) =>
    Array.from(getBucket(bucket).values()),
  ),
  removeRecord: vi.fn(async (bucket: string, id: string) => {
    getBucket(bucket).delete(id);
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...a: unknown[]) => hoisted.revalidatePath(...a),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => hoisted.redirect(path),
}));

vi.mock("next/headers", () => ({
  headers: async () => ({
    get: (key: string) => hoisted.headersGet(key),
  }),
}));

import { saveBuildDraft } from "@/app/configurator/actions";
import {
  signAgreement,
  submitDeposit,
  loadCheckoutBootstrap,
} from "@/app/checkout/actions";
import { BUILD_RECORDS_BUCKET } from "@/lib/build-records/storage";
import { AGREEMENTS_BUCKET } from "@/lib/agreements/storage";

const resetBuckets = () => {
  for (const b of buckets.values()) b.clear();
};

beforeEach(() => {
  resetBuckets();
  hoisted.requireUser.mockReset();
  hoisted.createDepositCharge.mockReset();
  hoisted.revalidatePath.mockReset();
  hoisted.redirect.mockReset();
  hoisted.redirect.mockImplementation((_path: string) => {
    throw new Error("__redirect__");
  });
  hoisted.headersGet.mockReset();
  hoisted.headersGet.mockImplementation((_key: string) => null);
});

describe("saveBuildDraft", () => {
  test("writes the BuildRecord to bucket 'build_records' keyed by its id", async () => {
    hoisted.requireUser.mockResolvedValue(
      makeFixtureUser({ id: "u_1", role: "buyer" }),
    );

    const result = await saveBuildDraft({
      buildRecordId: "b_new",
      selectedPackage: "premium",
      customizations: { wrap: true, paint: false },
      attachments: [{ type: "note", ref: "leather" }],
    });

    expect(result).toEqual({ ok: true, buildRecordId: "b_new" });
    expect(BUILD_RECORDS_BUCKET).toBe("build_records");
    const stored = getBucket("build_records").get("b_new") as {
      userId: string;
      selectedPackage: string;
      customizations: Record<string, boolean>;
      attachments: { type: string; ref: string }[];
    };
    expect(stored.userId).toBe("u_1");
    expect(stored.selectedPackage).toBe("premium");
    expect(stored.customizations.wrap).toBe(true);
    expect(stored.attachments).toHaveLength(1);
  });

  test("rejects when the user isn't the owner of the existing BuildRecord", async () => {
    hoisted.requireUser.mockResolvedValue(
      makeFixtureUser({ id: "attacker", role: "buyer" }),
    );
    getBucket("build_records").set(
      "b_victim",
      makeFixtureBuildRecord({ id: "b_victim", userId: "u_victim" }),
    );

    const result = await saveBuildDraft({
      buildRecordId: "b_victim",
      selectedPackage: "gold",
      customizations: {},
      attachments: [],
    });

    expect(result).toEqual({ ok: false, error: "Not your build record." });
    const stored = getBucket("build_records").get("b_victim") as {
      userId: string;
      selectedPackage?: string;
    };
    // Victim's record is not mutated.
    expect(stored.userId).toBe("u_victim");
    expect(stored.selectedPackage).toBeUndefined();
  });
});

describe("signAgreement", () => {
  test("rejects when acknowledgements are missing", async () => {
    hoisted.requireUser.mockResolvedValue(
      makeFixtureUser({ id: "u_1", role: "buyer" }),
    );
    getBucket("build_records").set(
      "b_1",
      makeFixtureBuildRecord({ id: "b_1", userId: "u_1" }),
    );
    const result = await signAgreement({
      buildRecordId: "b_1",
      signatureImage: "data:image/svg+xml;utf8,<svg/>",
      insuranceAcknowledged: false,
      nonRefundableAcknowledged: true,
      term: "3y",
      titleStatus: "clean",
      selectedPackage: "standard",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/acknowledge/);
    expect(getBucket("agreements").size).toBe(0);
  });

  test("writes AgreementDocument to bucket 'agreements' on happy path", async () => {
    hoisted.requireUser.mockResolvedValue(
      makeFixtureUser({ id: "u_1", role: "buyer" }),
    );
    getBucket("build_records").set(
      "b_1",
      makeFixtureBuildRecord({
        id: "b_1",
        userId: "u_1",
        selectedPackage: "premium",
      }),
    );
    hoisted.headersGet.mockImplementation((key: string) =>
      key === "x-forwarded-for" ? "203.0.113.9, 10.0.0.1" : null,
    );

    const result = await signAgreement({
      buildRecordId: "b_1",
      signatureImage: "data:image/svg+xml;utf8,<svg/>",
      insuranceAcknowledged: true,
      nonRefundableAcknowledged: true,
      term: "3y",
      titleStatus: "clean",
      selectedPackage: "premium",
    });

    expect(result.ok).toBe(true);
    expect(AGREEMENTS_BUCKET).toBe("agreements");
    if (result.ok) {
      const doc = getBucket("agreements").get(result.agreementId) as {
        userId: string;
        buildRecordId: string;
        clauses: string[];
        nonRefundableAcknowledged: true;
        insuranceAcknowledged: true;
        signaturePayload: { ip: string; image: string };
      };
      expect(doc.userId).toBe("u_1");
      expect(doc.buildRecordId).toBe("b_1");
      expect(doc.insuranceAcknowledged).toBe(true);
      expect(doc.nonRefundableAcknowledged).toBe(true);
      expect(doc.clauses).toContain("clause.non-refundable");
      expect(doc.clauses).toContain("clause.insurance-required");
      // First entry of x-forwarded-for wins.
      expect(doc.signaturePayload.ip).toBe("203.0.113.9");
    }
  });

  test("rejects when the viewer doesn't own the BuildRecord", async () => {
    hoisted.requireUser.mockResolvedValue(
      makeFixtureUser({ id: "attacker", role: "buyer" }),
    );
    getBucket("build_records").set(
      "b_1",
      makeFixtureBuildRecord({ id: "b_1", userId: "owner" }),
    );
    const result = await signAgreement({
      buildRecordId: "b_1",
      signatureImage: "data:image/svg+xml;utf8,<svg/>",
      insuranceAcknowledged: true,
      nonRefundableAcknowledged: true,
      term: "3y",
      titleStatus: "clean",
      selectedPackage: "standard",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Not your build record/);
  });
});

describe("submitDeposit", () => {
  test("calls createDepositCharge with the signed buildRecordId + agreementId", async () => {
    hoisted.requireUser.mockResolvedValue(
      makeFixtureUser({ id: "u_1", role: "buyer" }),
    );
    getBucket("build_records").set(
      "b_1",
      makeFixtureBuildRecord({ id: "b_1", userId: "u_1" }),
    );
    getBucket("agreements").set(
      "a_1",
      makeFixtureAgreementDocument({
        id: "a_1",
        userId: "u_1",
        buildRecordId: "b_1",
      }),
    );
    hoisted.createDepositCharge.mockResolvedValue({
      record: {
        id: "pay_1",
        amount: 1000,
        status: "succeeded",
      },
      clientSecret: "cs_test",
      paymentIntentId: "pi_test",
    });

    const result = await submitDeposit({
      buildRecordId: "b_1",
      agreementId: "a_1",
      paymentMethodId: "pm_card_visa",
    });

    expect(result).toEqual({
      ok: true,
      paymentId: "pay_1",
      paymentIntentId: "pi_test",
      amount: 1000,
      status: "succeeded",
    });
    expect(hoisted.createDepositCharge).toHaveBeenCalledWith({
      userId: "u_1",
      buildRecordId: "b_1",
      agreementId: "a_1",
      paymentMethodId: "pm_card_visa",
    });
  });

  test("rejects when the current user does not own the BuildRecord", async () => {
    hoisted.requireUser.mockResolvedValue(
      makeFixtureUser({ id: "attacker", role: "buyer" }),
    );
    getBucket("build_records").set(
      "b_1",
      makeFixtureBuildRecord({ id: "b_1", userId: "victim" }),
    );
    getBucket("agreements").set(
      "a_1",
      makeFixtureAgreementDocument({
        id: "a_1",
        userId: "victim",
        buildRecordId: "b_1",
      }),
    );

    const result = await submitDeposit({
      buildRecordId: "b_1",
      agreementId: "a_1",
      paymentMethodId: "pm_card_visa",
    });

    expect(result.ok).toBe(false);
    expect(hoisted.createDepositCharge).not.toHaveBeenCalled();
  });

  test("rejects when the agreement does not match the build", async () => {
    hoisted.requireUser.mockResolvedValue(
      makeFixtureUser({ id: "u_1", role: "buyer" }),
    );
    getBucket("build_records").set(
      "b_1",
      makeFixtureBuildRecord({ id: "b_1", userId: "u_1" }),
    );
    getBucket("agreements").set(
      "a_1",
      makeFixtureAgreementDocument({
        id: "a_1",
        userId: "u_1",
        buildRecordId: "b_other",
      }),
    );

    const result = await submitDeposit({
      buildRecordId: "b_1",
      agreementId: "a_1",
      paymentMethodId: "pm_card_visa",
    });

    expect(result.ok).toBe(false);
    expect(hoisted.createDepositCharge).not.toHaveBeenCalled();
  });
});

describe("loadCheckoutBootstrap", () => {
  test("reports hasAgreement=true with the agreementId when one already exists", async () => {
    hoisted.requireUser.mockResolvedValue(
      makeFixtureUser({ id: "u_1", role: "buyer" }),
    );
    getBucket("build_records").set(
      "b_1",
      makeFixtureBuildRecord({ id: "b_1", userId: "u_1" }),
    );
    getBucket("agreements").set(
      "a_pre",
      makeFixtureAgreementDocument({
        id: "a_pre",
        userId: "u_1",
        buildRecordId: "b_1",
      }),
    );
    const result = await loadCheckoutBootstrap("b_1");
    expect(result).toEqual({
      ok: true,
      buildRecordId: "b_1",
      hasAgreement: true,
      agreementId: "a_pre",
    });
  });

  test("reports hasAgreement=false when none exists yet", async () => {
    hoisted.requireUser.mockResolvedValue(
      makeFixtureUser({ id: "u_1", role: "buyer" }),
    );
    getBucket("build_records").set(
      "b_1",
      makeFixtureBuildRecord({ id: "b_1", userId: "u_1" }),
    );
    const result = await loadCheckoutBootstrap("b_1");
    expect(result).toEqual({
      ok: true,
      buildRecordId: "b_1",
      hasAgreement: false,
    });
  });
});
