import { notFound } from "next/navigation";
import { requireUser } from "@/services/team-01-auth";
import { listListings } from "@/services/team-03-supply";
import { loadUserById } from "@/lib/profiles/load-user";
import { ProfileHeader } from "@/components/profiles/profile-header";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { openSellerThread } from "./actions";

type PageProps = { params: Promise<{ userId: string }> };

export const dynamic = "force-dynamic";

const chatHandleFor = (displayName: string | undefined, id: string): string => {
  const base = (displayName ?? id).toLowerCase().replace(/[^a-z0-9]+/g, "");
  return `@${base || "seller"}`;
};

export default async function SellerProfilePage({ params }: PageProps) {
  const { userId } = await params;
  const viewer = await requireUser();
  const target = userId === viewer.id ? viewer : await loadUserById(userId);
  if (!target || target.role !== "seller") notFound();

  // Per ARCHITECTURE §3.1 + Team 2 charter: one active user-posted listing per
  // individual seller. If the store ever returns more, we render the most
  // recently refreshed one (listListings is already ordered that way).
  const listings = await listListings({
    ownerUserId: target.id,
    source: "user",
  });
  const activeListing = listings[0] ?? null;

  const isSelf = viewer.id === target.id;
  const chatHandle = chatHandleFor(target.displayName, target.id);

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 md:py-10">
      <ProfileHeader
        user={target}
        eyebrow="Individual seller"
        accentLabel={chatHandle}
      />

      <div className="flex items-center justify-between gap-3">
        <span
          data-testid="seller-chat-handle"
          className="text-sm text-zinc-600 dark:text-zinc-300"
        >
          Chat handle: <strong>{chatHandle}</strong>
        </span>
        {!isSelf ? (
          <form action={openSellerThread}>
            <input type="hidden" name="sellerId" defaultValue={target.id} />
            {activeListing ? (
              <input
                type="hidden"
                name="listingId"
                defaultValue={activeListing.id}
              />
            ) : null}
            <button
              type="submit"
              data-testid="seller-message-button"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
            >
              Message {chatHandle}
            </button>
          </form>
        ) : null}
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold text-zinc-950 dark:text-white">
          Active listing
        </h2>
        {activeListing ? (
          <div data-testid="seller-active-listing" className="max-w-sm">
            <VehicleCard
              listing={activeListing}
              userZip={viewer.zip}
              href={`/listings/${activeListing.id}`}
            />
          </div>
        ) : (
          <p
            data-testid="seller-empty"
            className="text-sm text-zinc-500 dark:text-zinc-400"
          >
            No active listing right now.
          </p>
        )}
      </div>
    </section>
  );
}
