import { notFound } from "next/navigation";
import { requireUser } from "@/services/team-01-auth";
import { refreshListing } from "@/services/team-03-supply";
import { quoteAllPaths } from "@/services/team-11-pricing";
import {
  getPricingGuidance,
  requestInspection,
} from "@/services/team-11-intelligence";
import {
  getConversionState,
} from "@/services/team-12-workflows";
import { listComments } from "@/lib/listings/comments";
import { makeFixtureIntakeState, type PathKind } from "@/contracts";
import { PhotoGallery } from "@/components/vehicles/photo-gallery";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { AllAcquisitionPaths } from "@/components/vehicles/all-acquisition-paths";
import { AvailableActionsBar } from "@/components/vehicles/available-actions-bar";
import { CommentsSection } from "@/components/vehicles/comments-section";
import { DistanceDisplay } from "@/components/vehicles/distance-display";
import { DownPaymentDisplay } from "@/components/vehicles/down-payment-display";
import { PricingGuidancePanel } from "@/components/vehicles/pricing-guidance-panel";
import { InspectionPanel } from "@/components/vehicles/inspection-panel";

type PageProps = { params: Promise<{ id: string }> };

const guidancePathForSource = (
  source: import("@/contracts").ListingObject["source"],
): PathKind => {
  if (source === "copart" || source === "iaai") return "auction";
  if (source === "dealer") return "dealer";
  if (source === "craigslist" || source === "user") return "private";
  return "picknbuild";
};

const riskTierFromCredit = (
  creditScore: number | undefined,
  noCredit: boolean | undefined,
): "low" | "med" | "high" => {
  if (noCredit || creditScore === undefined) return "high";
  if (creditScore >= 720) return "low";
  if (creditScore >= 620) return "med";
  return "high";
};

export const dynamic = "force-dynamic";

export default async function VehicleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireUser();

  const refresh = await refreshListing(id);
  if (!refresh.ok) notFound();
  const listing = refresh.listing;

  const fallbackIntake = makeFixtureIntakeState({
    location: { zip: user.zip },
    creditScore: user.creditScore,
    noCredit: user.noCredit,
  });
  const intake = fallbackIntake;

  const [quotes, conversionState, inspection] = await Promise.all([
    quoteAllPaths(listing, intake),
    getConversionState({ userId: user.id, listingId: listing.id }),
    requestInspection({ listing, listingId: listing.id }),
  ]);

  const primaryPath = guidancePathForSource(listing.source);
  const guidance = await getPricingGuidance({ listing, path: primaryPath });

  const initialComments = await loadCommentsSafe(listing.id);

  const riskTier = riskTierFromCredit(user.creditScore, user.noCredit);

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 md:py-10">
      <header className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Vehicle detail
        </p>
        <h1 className="text-2xl font-semibold text-foreground">
          {`${listing.year} ${listing.make} ${listing.model}${listing.trim ? ` ${listing.trim}` : ""}`}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <DistanceDisplay
            userZip={user.zip}
            listingZip={listing.locationZip}
          />
          {listing.mileage !== undefined ? (
            <span>{listing.mileage.toLocaleString()} mi</span>
          ) : null}
          <span data-testid="refresh-indicator" data-refreshed={refresh.refreshed ? "true" : "false"}>
            {refresh.refreshed
              ? "Freshly refreshed"
              : refresh.reason === "no-refresh-for-source"
                ? "Live from source"
                : "Refreshed recently"}
          </span>
        </div>
      </header>

      <PhotoGallery
        photos={listing.photos}
        title={`${listing.year} ${listing.make} ${listing.model}`}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <AllAcquisitionPaths
            quotes={quotes}
            listingId={listing.id}
            bestFitPath={primaryPath}
          />
          <DownPaymentDisplay quotes={quotes} />
          <AvailableActionsBar
            listing={listing}
            conversionState={conversionState}
          />
          <CommentsSection
            listingId={listing.id}
            initialComments={initialComments}
            currentUserId={user.id}
          />
        </div>
        <aside className="flex flex-col gap-4">
          <VehicleCard
            listing={listing}
            variant="detail"
            userZip={user.zip}
            riskTier={riskTier}
          />
          <PricingGuidancePanel guidance={guidance} />
          <InspectionPanel inspection={inspection} />
        </aside>
      </div>
    </section>
  );
}

async function loadCommentsSafe(listingId: string) {
  try {
    return await listComments(listingId);
  } catch {
    return [];
  }
}
