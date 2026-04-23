import { requireUser } from "@/services/team-01-auth";
import { getListing } from "@/services/team-03-supply";
import { getConversionState } from "@/services/team-12-workflows";
import { listGarageItems } from "@/lib/garage/store";
import { GaragePageClient, type GarageSeed } from "./garage-page-client";

export const dynamic = "force-dynamic";

/**
 * Garage shell. Requires a fully-onboarded user (Team 1's requireAuth gate),
 * loads the saved-vehicle set through Team 8's store, hydrates each item with
 * its ListingObject and per-user ConversionState, then hands the set to a
 * client tree that recomputes path quotes and applies IntakeState filters.
 */
export default async function GaragePage() {
  const user = await requireUser();
  const items = await listGarageItems(user.id);

  const seeds = await Promise.all(
    items.map(async (item) => {
      const listing = await getListing(item.listingId);
      if (!listing) return null;
      const conversionState = await getConversionState({
        userId: user.id,
        listingId: item.listingId,
      });
      return { item, listing, conversionState };
    }),
  );
  const hydrated: GarageSeed[] = seeds.filter(
    (s): s is GarageSeed => s !== null,
  );

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:px-6">
      <header className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
          Garage
        </h1>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {hydrated.length} saved
        </span>
      </header>
      <GaragePageClient user={user} seeds={hydrated} />
    </main>
  );
}
