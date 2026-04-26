"use client";

import { useState } from "react";
import type { ListingObject } from "@/contracts";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { DealerListingForm } from "./dealer-listing-form";
import { removeDealerListing } from "@/app/dealers/[userId]/actions";

type Props = {
  listing: ListingObject;
  userZip?: string;
};

export function DealerListingRow({ listing, userZip }: Props) {
  const [editing, setEditing] = useState(false);

  return (
    <div
      data-testid="dealer-listing-row"
      data-listing-id={listing.id}
      className="space-y-3"
    >
      <VehicleCard listing={listing} userZip={userZip} />
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          data-testid="dealer-listing-edit"
          onClick={() => setEditing((v) => !v)}
          className="rounded-md border border-border px-2.5 py-1 text-xs-700"
        >
          {editing ? "Cancel" : "Edit"}
        </button>
        <form action={removeDealerListing}>
          <input type="hidden" name="listingId" defaultValue={listing.id} />
          <button
            type="submit"
            data-testid="dealer-listing-remove"
            className="rounded-md border border-rose-300 px-2.5 py-1 text-xs text-rose-700-700 dark:text-rose-300"
          >
            Remove
          </button>
        </form>
      </div>
      {editing ? <DealerListingForm listing={listing} /> : null}
    </div>
  );
}
