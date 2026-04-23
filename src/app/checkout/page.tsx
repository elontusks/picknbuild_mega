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

type SearchParams = { build?: string };

// Title resolution must mirror signAgreement's server-side derivation so the
// preview summary on screen is the same text the server will later sign.
const resolveServerTitleStatus = (
  build: { tradeIn?: { titleStatus: "clean" | "rebuilt" } },
  listingTitle?: TitleStatus,
): TitleStatus => {
  if (listingTitle && listingTitle !== "unknown") return listingTitle;
  if (build.tradeIn?.titleStatus === "rebuilt") return "rebuilt";
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
  if (!build.selectedPackage) {
    // No package picked yet → nothing to sign.
    redirect("/configurator");
  }
  const selectedPackage: PackageTier = build.selectedPackage;
  const term: Term = PACKAGE_BY_TIER[selectedPackage].defaultTerm;

  const listing = build.listingId ? await getListing(build.listingId) : null;
  const titleStatus = resolveServerTitleStatus(
    build,
    listing?.titleStatus,
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
    build,
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
