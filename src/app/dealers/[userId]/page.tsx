import { notFound } from "next/navigation";
import { requireUser } from "@/services/team-01-auth";
import { listListings } from "@/services/team-03-supply";
import { getSubscription } from "@/services/team-14-payments";
import { loadUserById } from "@/lib/profiles/load-user";
import { ProfileHeader } from "@/components/profiles/profile-header";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { DealerPageEditPanel } from "@/components/profiles/dealer-page-edit-panel";
import { openDealerThread } from "./actions";

type PageProps = { params: Promise<{ userId: string }> };

export const dynamic = "force-dynamic";

export default async function DealerProfilePage({ params }: PageProps) {
  const { userId } = await params;
  const viewer = await requireUser();
  const target = userId === viewer.id ? viewer : await loadUserById(userId);
  if (!target || target.role !== "dealer") notFound();

  const listings = await listListings({
    ownerUserId: target.id,
    source: "dealer",
  });

  const isOwner = viewer.id === target.id && viewer.role === "dealer";
  const subscription = isOwner ? await getSubscription(viewer.id) : null;

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 md:py-10">
      <ProfileHeader
        user={target}
        eyebrow="Dealer"
        accentLabel={isOwner ? "You own this page" : undefined}
      />

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">
          Active listings
        </h2>
        {!isOwner ? (
          <form action={openDealerThread}>
            <input type="hidden" name="dealerId" defaultValue={target.id} />
            <button
              type="submit"
              data-testid="dealer-message-button"
              className="rounded-md border border-border px-3 py-1.5 text-sm-700"
            >
              Message dealer
            </button>
          </form>
        ) : null}
      </div>

      {listings.length === 0 ? (
        <p
          data-testid="dealer-empty"
          className="text-sm text-muted-foreground"
        >
          No active listings.
        </p>
      ) : (
        <ul
          data-testid="dealer-listings-grid"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {listings.map((listing) => (
            <li key={listing.id}>
              <VehicleCard
                listing={listing}
                userZip={viewer.zip}
                href={`/listings/${listing.id}`}
              />
            </li>
          ))}
        </ul>
      )}

      {isOwner ? (
        <DealerPageEditPanel
          dealerId={target.id}
          listings={listings}
          subscription={subscription}
          userZip={viewer.zip}
        />
      ) : null}
    </section>
  );
}
