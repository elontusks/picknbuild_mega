"use client";

import { useState } from "react";
import {
  DealerSubscriptionManagementPanel as BaseSubscriptionPanel,
  LeadUnlockPurchaseInterface as BaseLeadUnlock,
  ListingPriceModal,
} from "@/components/payments";

export const DealerSubscriptionManagementPanel = BaseSubscriptionPanel;
export const LeadUnlockPurchaseInterface = BaseLeadUnlock;

type TriggerProps = { listingId: string };

/**
 * Client wrapper around the Team 14 ListingPriceModal so we can host the
 * open/closed state inside the dealer edit panel without the panel itself
 * becoming a client component.
 */
export function ListingPriceModalTrigger({ listingId }: TriggerProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        data-testid="listing-price-modal-trigger"
        data-listing-id={listingId}
        onClick={() => setOpen(true)}
        className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs dark:border-zinc-700"
      >
        Pay listing fee
      </button>
      <ListingPriceModal
        listingId={listingId}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
