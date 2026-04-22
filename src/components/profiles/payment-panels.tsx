"use client";

import { useState } from "react";
import {
  DealerSubscriptionManagementPanel as BaseSubscriptionPanel,
  ListingPriceModal,
} from "@/components/payments";

export const DealerSubscriptionManagementPanel = BaseSubscriptionPanel;

type TriggerProps = { listingId: string };

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
