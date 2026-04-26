import "server-only";
import { listListings } from "@/services/team-03-supply";
import type { Car } from "./types";
import { isPicknbuildEligible, listingToCar } from "./listing-to-car";

export type SearchListings = {
  all: Car[];
  dealer: Car[];
  auction: Car[];
  individual: Car[];
  picknbuild: Car[];
};

/**
 * Server-only loader for the /search surface. Reads active rows from the
 * persisted ListingObject store (team-03-supply) and buckets them into the
 * four-column shape the demo UI consumes. No live scraping happens here —
 * the link-parser flow handles paste-a-link separately.
 */
export async function loadSearchListings(): Promise<SearchListings> {
  const listings = await listListings({ status: "active", limit: 100 });

  const all: Car[] = [];
  const dealer: Car[] = [];
  const auction: Car[] = [];
  const individual: Car[] = [];
  const picknbuild: Car[] = [];

  for (const listing of listings) {
    const car = listingToCar(listing);
    all.push(car);
    if (car.path === "dealer") dealer.push(car);
    else if (car.path === "auction") auction.push(car);
    else if (car.path === "individual") individual.push(car);
    if (isPicknbuildEligible(listing)) picknbuild.push(car);
  }

  return { all, dealer, auction, individual, picknbuild };
}
