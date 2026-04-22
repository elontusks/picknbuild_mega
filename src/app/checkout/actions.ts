"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  nextFixtureId,
  nowIso,
  type AgreementDocument,
  type PackageTier,
  type Term,
  type TitleStatus,
} from "@/contracts";
import { requireUser } from "@/services/team-01-auth";
import { createDepositCharge } from "@/services/team-14-payments";
import { loadBuildRecordForUser } from "@/lib/build-records/storage";
import {
  loadAgreementForUser,
  putAgreement,
} from "@/lib/agreements/storage";
import { PICKNBUILD_CLAUSE_IDS } from "@/lib/agreements/clauses";
import { buildSpecSummary } from "@/lib/build-records/summary";
import { quoteLivePrice } from "@/lib/build-records/price";

export type SignAgreementInput = {
  buildRecordId: string;
  signatureImage: string;
  insuranceAcknowledged: boolean;
  nonRefundableAcknowledged: boolean;
  term: Term;
  titleStatus: TitleStatus;
  selectedPackage: PackageTier;
};

export type SignAgreementResult =
  | { ok: true; agreementId: string }
  | { ok: false; error: string };

const resolveClientIp = async (): Promise<string> => {
  const h = await headers();
  // `x-forwarded-for` may be a comma-separated list; first entry is the
  // client. Fall back to the runtime-provided real-ip header, then 127.0.0.1
  // so dev environments without a proxy still produce a usable value.
  const xff = h.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip")?.trim() || "127.0.0.1";
};

export async function signAgreement(
  input: SignAgreementInput,
): Promise<SignAgreementResult> {
  const viewer = await requireUser();
  if (!input.insuranceAcknowledged || !input.nonRefundableAcknowledged) {
    return {
      ok: false,
      error: "You must acknowledge both notices before signing.",
    };
  }
  if (!input.signatureImage) {
    return { ok: false, error: "Signature is required." };
  }

  const access = await loadBuildRecordForUser({
    buildRecordId: input.buildRecordId,
    userId: viewer.id,
  });
  if (!access.ok) {
    return {
      ok: false,
      error:
        access.reason === "not-found"
          ? "Build record not found."
          : "Not your build record.",
    };
  }

  const priced = quoteLivePrice({
    packageTier: input.selectedPackage,
    customizations: access.record.customizations,
    term: input.term,
    titleStatus: input.titleStatus,
    creditScore: viewer.creditScore,
    noCredit: viewer.noCredit,
    tradeInValue: access.record.tradeIn?.estimatedValue,
  });

  const renderedSpecSummary = buildSpecSummary({
    build: { ...access.record, selectedPackage: input.selectedPackage },
    term: input.term,
    titleStatus: input.titleStatus,
    total: priced.total,
    down: priced.down,
    biweekly: priced.biweekly,
  });

  const ip = await resolveClientIp();
  const doc: AgreementDocument = {
    id: nextFixtureId("agreement"),
    userId: viewer.id,
    buildRecordId: access.record.id,
    renderedSpecSummary,
    clauses: [...PICKNBUILD_CLAUSE_IDS],
    signaturePayload: {
      image: input.signatureImage,
      signedAt: nowIso(),
      ip,
    },
    nonRefundableAcknowledged: true,
    insuranceAcknowledged: true,
    // Team 10 renders this; v1 ships a stubbed URL. Real PDF generation is
    // tracked separately — the agreement contract otherwise carries the
    // signed payload inline for retrieval.
    pdfUrl: `pending://agreement/${viewer.id}`,
  };

  await putAgreement(doc);
  revalidatePath(`/checkout`);
  return { ok: true, agreementId: doc.id };
}

export type SubmitDepositInput = {
  buildRecordId: string;
  agreementId: string;
  paymentMethodId: string;
};

export type SubmitDepositResult =
  | {
      ok: true;
      paymentId: string;
      paymentIntentId: string;
      amount: number;
      status: "succeeded" | "pending" | "failed" | "refunded";
    }
  | { ok: false; error: string };

export async function submitDeposit(
  input: SubmitDepositInput,
): Promise<SubmitDepositResult> {
  const viewer = await requireUser();
  const build = await loadBuildRecordForUser({
    buildRecordId: input.buildRecordId,
    userId: viewer.id,
  });
  if (!build.ok) {
    return {
      ok: false,
      error:
        build.reason === "not-found"
          ? "Build record not found."
          : "Not your build record.",
    };
  }
  const agreement = await loadAgreementForUser({
    agreementId: input.agreementId,
    userId: viewer.id,
  });
  if (!agreement.ok) {
    return {
      ok: false,
      error:
        agreement.reason === "not-found"
          ? "Agreement not found."
          : "Not your agreement.",
    };
  }
  if (agreement.agreement.buildRecordId !== build.record.id) {
    return { ok: false, error: "Agreement does not match build." };
  }

  try {
    const charge = await createDepositCharge({
      userId: viewer.id,
      buildRecordId: build.record.id,
      agreementId: agreement.agreement.id,
      paymentMethodId: input.paymentMethodId,
    });
    return {
      ok: true,
      paymentId: charge.record.id,
      paymentIntentId: charge.paymentIntentId,
      amount: charge.record.amount,
      status: charge.record.status,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Deposit charge failed.",
    };
  }
}

export type CheckoutBootstrap =
  | {
      ok: true;
      buildRecordId: string;
      hasAgreement: boolean;
      agreementId?: string;
    }
  | { ok: false; error: string };

export async function loadCheckoutBootstrap(
  buildRecordId: string,
): Promise<CheckoutBootstrap> {
  const viewer = await requireUser();
  const build = await loadBuildRecordForUser({
    buildRecordId,
    userId: viewer.id,
  });
  if (!build.ok) {
    return {
      ok: false,
      error:
        build.reason === "not-found"
          ? "Build record not found."
          : "Not your build record.",
    };
  }
  // Look up whether an agreement already exists for this build record. If so
  // checkout jumps straight to the deposit step.
  const existingAgreementId = await findAgreementIdForBuild({
    buildRecordId: build.record.id,
    userId: viewer.id,
  });
  return {
    ok: true,
    buildRecordId: build.record.id,
    hasAgreement: existingAgreementId != null,
    ...(existingAgreementId ? { agreementId: existingAgreementId } : {}),
  };
}

const findAgreementIdForBuild = async (input: {
  buildRecordId: string;
  userId: string;
}): Promise<string | undefined> => {
  const { listRecords } = await import("@/services/team-15-storage");
  const agreements = await listRecords<AgreementDocument>("agreements");
  return agreements.find(
    (a) => a.buildRecordId === input.buildRecordId && a.userId === input.userId,
  )?.id;
};

