import { redirect } from "next/navigation";
import type { AgreementDocument, PackageTier, Term, TitleStatus } from "@/contracts";
import { requireUser } from "@/services/team-01-auth";
import { getListing } from "@/services/team-03-supply";
import { listRecords } from "@/services/team-15-storage";
import { loadBuildRecordForUser } from "@/lib/build-records/storage";
import { AGREEMENTS_BUCKET } from "@/lib/agreements/storage";
import { DEPOSIT_AMOUNT_USD } from "@/lib/payments/amounts";
import { quoteLivePrice } from "@/lib/build-records/price";
import { buildSpecSummary } from "@/lib/build-records/summary";
import { PACKAGE_BY_TIER } from "@/lib/build-records/packages";
import { CheckoutClient } from "@/components/checkout/checkout-client";

type SearchParams = {
  build?: string;
  pkg?: string;
  term?: string;
};

const isPackageTier = (v: string | undefined): v is PackageTier =>
  v === "standard" ||
  v === "premium" ||
  v === "silver" ||
  v === "platinum" ||
  v === "gold";

const isTerm = (v: string | undefined): v is Term =>
  v === "cash" || v === "1y" || v === "2y" || v === "3y" || v === "4y" || v === "5y";

const resolveTitleStatus = (titleStatus?: string): TitleStatus => {
  if (titleStatus === "rebuilt") return "rebuilt";
  if (titleStatus === "unknown") return "unknown";
  return "clean";
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const viewer = await requireUser();
  const params = await searchParams;
  const buildRecordId = params.build;
  if (!buildRecordId) redirect("/configurator");

  const access = await loadBuildRecordForUser({
    buildRecordId,
    userId: viewer.id,
  });
  if (!access.ok) {
    // Don't leak forbidden vs. not-found: both kick back to the configurator.
    redirect("/configurator");
  }

  const build = access.record;
  const selectedPackage: PackageTier = isPackageTier(params.pkg)
    ? params.pkg
    : build.selectedPackage ?? "standard";
  const term: Term = isTerm(params.term)
    ? params.term
    : PACKAGE_BY_TIER[selectedPackage].defaultTerm;

  const listing = build.listingId ? await getListing(build.listingId) : null;
  const titleStatus = resolveTitleStatus(
    listing?.titleStatus ?? (build.tradeIn?.titleStatus as TitleStatus | undefined),
  );

  const priced = quoteLivePrice({
    packageTier: selectedPackage,
    customizations: build.customizations,
    term,
    titleStatus,
    creditScore: viewer.creditScore,
    noCredit: viewer.noCredit,
    tradeInValue: build.tradeIn?.estimatedValue,
  });

  const summary = buildSpecSummary({
    build: { ...build, selectedPackage },
    ...(listing ? { listing } : {}),
    term,
    titleStatus,
    total: priced.total,
    down: priced.down,
    biweekly: priced.biweekly,
  });

  const existingAgreementId = await findAgreementForBuild({
    buildRecordId: build.id,
    userId: viewer.id,
  });

  return (
    <CheckoutClient
      buildRecordId={build.id}
      specSummary={summary}
      selectedPackage={selectedPackage}
      term={term}
      titleStatus={titleStatus}
      depositAmount={DEPOSIT_AMOUNT_USD}
      {...(existingAgreementId ? { initialAgreementId: existingAgreementId } : {})}
    />
  );
}

const findAgreementForBuild = async (input: {
  buildRecordId: string;
  userId: string;
}): Promise<string | undefined> => {
  const all = await listRecords<AgreementDocument>(AGREEMENTS_BUCKET);
  return all.find(
    (a) => a.buildRecordId === input.buildRecordId && a.userId === input.userId,
  )?.id;
};
