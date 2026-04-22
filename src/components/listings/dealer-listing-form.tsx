"use client";

import { ListingForm } from "./listing-form";
import type { ListingObject } from "@/contracts";

/**
 * Dealer-Posted Listing Form — the authoring UI mounted inside Team 2's
 * Dealer Page Edit Panel. Writes a `ListingObject` with `source: "dealer"`
 * and `ownerUserId` = current dealer. No scraping path; dealers own their
 * edits (see ARCHITECTURE §2 "Dealer model").
 */
export function DealerListingForm({
  onCreated,
}: {
  onCreated?: (listing: ListingObject) => void;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Post a new listing</h2>
      <p className="text-sm text-neutral-600">
        Dealer-posted listings appear on your dealer page and in buyer search
        results. You can edit or remove any listing you own from this panel.
      </p>
      <ListingForm mode="dealer" onCreated={onCreated} />
    </div>
  );
}
