import { requireUser } from "@/services/team-01-auth";
import { loadSearchListings } from "@/lib/search-demo/load-listings";
import { SearchPageClient } from "./search-page-client";

export const dynamic = "force-dynamic";

/**
 * Search surface shell. RSC requires the user (Team 1's requireAuth gate),
 * loads the persisted listing pool from team-03-supply, and hands both to
 * the client tree.
 */
export default async function SearchPage() {
  const user = await requireUser();
  const listings = await loadSearchListings();
  return (
    <SearchPageClient
      user={user}
      initialDealerCars={listings.dealer}
      initialAuctionCars={listings.auction}
      initialIndividualCars={listings.individual}
      initialPicknbuildCars={listings.picknbuild}
    />
  );
}
