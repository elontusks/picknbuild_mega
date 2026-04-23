import { VehicleCard } from "@/components/vehicles/vehicle-card";
import type { ListingObject } from "@/contracts";

// Wraps Team 7's VehicleCard with the "feed" variant. Deliberately thin:
// every sizing / styling decision lives in VehicleCard so the shape stays
// consistent with the rest of the app.
export function VehicleCardInFeed({
  listing,
  userZip,
}: {
  listing: ListingObject;
  userZip?: string;
}) {
  return (
    <div data-testid="vehicle-card-in-feed" className="max-w-sm">
      <VehicleCard
        listing={listing}
        variant="feed"
        href={`/listings/${listing.id}`}
        {...(userZip ? { userZip } : {})}
      />
    </div>
  );
}
