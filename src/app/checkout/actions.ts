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
import { getListing } from "@/services/team-03-supply";
import { listRecords } from "@/services/team-15-storage";
import { loadBuildRecordForUser } from "@/lib/build-records/storage";
import {
  AGREEMENTS_BUCKET,
  loadAgreementForUser,
  putAgreement,
} from "@/lib/agreements/storage";
import { PICKNBUILD_CLAUSE_IDS } from "@/lib/agreements/clauses";
import { buildSpecSummary } from "@/lib/build-records/summary";
import { quoteLivePrice } from "@/lib/build-records/price";
import { PACKAGE_BY_TIER } from "@/lib/build-records/packages";

export type SignAgreementInput = {
  buildRecordId: string;
  signatureImage: string;
  insuranceAcknowledged: boolean;
  nonRefundableAcknowledged: boolean;
};

export type SignAgreementResult =
  | { ok: true; agreementId: string; alreadySigned?: boolean }
  | { ok: false; error: string };

// TRUSTED-PROXY ASSUMPTION.
// `x-forwarded-for` is only reliable behind a proxy that rewrites the header
// for every incoming request (Vercel, Cloudflare, a correctly configured
// nginx). If this app is ever deployed without such a proxy, a caller can
// spoof an arbitrary IP here — the value is only used as the audit stamp on
// AgreementDocument.signaturePayload.ip, but do not copy-paste this helper
// into any path where the IP gates a security decision.
const resolveClientIp = async (): Promise<string> => {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip")?.trim() || "127.0.0.1";
};

// Derive the title status for pricing + summary server-side. The configurator
// client cannot influence this: a listing-anchored build uses the listing's
// parsed title, a spec-based build honors a tradeIn hint, and everything else
// falls to "clean". A malicious client that POSTs titleStatus: "rebuilt" to
// save on the rebuilt-vehicle discount never reaches this code path.
const resolveServerTitleStatus = async (
  build: { listingId?: string; tradeIn?: { titleStatus: "clean" | "rebuilt" } },
): Promise<TitleStatus> => {
  if (build.listingId) {
    const listing = await getListing(build.listingId);
    if (listing?.titleStatus && listing.titleStatus !== "unknown") {
      return listing.titleStatus;
    }
  }
  if (build.tradeIn?.titleStatus === "rebuilt") return "rebuilt";
  return "clean";
};

const findAgreementIdForBuild = async (input: {
  buildRecordId: string;
  userId: string;
}): Promise<string | undefined> => {
  const all = await listRecords<AgreementDocument>(AGREEMENTS_BUCKET);
  return all.find(
    (a) => a.buildRecordId === input.buildRecordId && a.userId === input.userId,
  )?.id;
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
  const build = access.record;

  // Idempotency: if an agreement already exists for this (userId,
  // buildRecordId) pair, return its id instead of minting a duplicate. This
  // covers double-submit from the client as well as deliberate replay.
  const existingAgreementId = await findAgreementIdForBuild({
    buildRecordId: build.id,
    userId: viewer.id,
  });
  if (existingAgreementId) {
    return { ok: true, agreementId: existingAgreementId, alreadySigned: true };
  }

  // The user must have picked a package before signing. We read it from the
  // persisted BuildRecord rather than from the request body — otherwise a
  // crafted POST could sign for a cheaper tier than the configurator showed.
  const selectedPackage: PackageTier | undefined = build.selectedPackage;
  if (!selectedPackage) {
    return {
      ok: false,
      error: "Pick a package in the configurator before signing.",
    };
  }

  // Term is derived server-side from the package default. BuildRecord (§3.3)
  // does not store a term, so we intentionally do not trust the checkout
  // client to supply one — a malicious caller could otherwise POST
  // `term: "cash"` to zero out the biweekly figure on the signed summary.
  const term: Term = PACKAGE_BY_TIER[selectedPackage].defaultTerm;
  const titleStatus = await resolveServerTitleStatus(build);

  const priced = quoteLivePrice({
    packageTier: selectedPackage,
    customizations: build.customizations,
    term,
    titleStatus,
    creditScore: viewer.creditScore,
    noCredit: viewer.noCredit,
    tradeInValue: build.tradeIn?.estimatedValue,
  });

  const renderedSpecSummary = buildSpecSummary({
    build,
    term,
    titleStatus,
    total: priced.total,
    down: priced.down,
    biweekly: priced.biweekly,
  });

  const ip = await resolveClientIp();
  const doc: AgreementDocument = {
    id: nextFixtureId("agreement"),
    userId: viewer.id,
    buildRecordId: build.id,
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

