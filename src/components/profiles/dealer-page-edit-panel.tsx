import type { ListingObject } from "@/contracts";
import {
  DealerSubscriptionManagementPanel,
  ListingPriceModalTrigger,
} from "./payment-panels";
import { DealerListingForm } from "./dealer-listing-form";
import { DealerListingRow } from "./dealer-listing-row";
import type { Subscription } from "@/services/team-14-payments";

type Props = {
  dealerId: string;
  listings: ListingObject[];
  subscription: Subscription | null;
  userZip?: string;
};

export function DealerPageEditPanel({
  dealerId,
  listings,
  subscription,
  userZip,
}: Props) {
  return (
    <section
      data-testid="dealer-edit-panel"
      data-dealer-id={dealerId}
      className="space-y-6 rounded-xl border border-amber-300 bg-amber-50/50 p-4 dark:border-amber-700 dark:bg-amber-900/10"
    >
      <header className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-wide text-amber-800 dark:text-amber-200">
          Dealer mode
        </p>
        <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
          Manage your dealer page
        </h2>
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
          Post, edit, or remove listings. Billing controls are below.
        </p>
      </header>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
          Post a new listing
        </h3>
        <DealerListingForm />
      </div>

      {listings.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
            Your active listings
          </h3>
          <ul
            data-testid="dealer-edit-listings"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {listings.map((listing) => (
              <li key={listing.id}>
                <DealerListingRow listing={listing} userZip={userZip} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <DealerSubscriptionManagementPanel initialSubscription={subscription} />

      {listings.length > 0 ? (
        <div className="space-y-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h3 className="text-base font-semibold">Extra-listing fees</h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            Over quota? Activate an additional listing for a one-time charge.
          </p>
          <ul className="space-y-1">
            {listings.map((listing) => (
              <li
                key={listing.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span>
                  {listing.year} {listing.make} {listing.model}
                </span>
                <ListingPriceModalTrigger listingId={listing.id} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
