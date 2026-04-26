"use client";

import { useState } from "react";
import { LISTING_FEE_AMOUNT_USD } from "@/lib/payments/amounts";
import { PaymentProcessingInterface } from "./payment-processing-interface";

type Props = {
  listingId: string;
  open: boolean;
  onClose: () => void;
  onCharged?: (paymentId: string) => void;
};

export function ListingPriceModal({
  listingId,
  open,
  onClose,
  onCharged,
}: Props) {
  const [done, setDone] = useState(false);
  if (!open) return null;

  const submit = async (paymentMethodId: string) => {
    const res = await fetch("/api/payments/listing-fee", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, paymentMethodId }),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error ?? `Charge failed (${res.status})`);
    }
    const { record } = (await res.json()) as { record: { id: string } };
    setDone(true);
    onCharged?.(record.id);
  };

  return (
    <div
      data-testid="listing-price-modal"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50"
    >
      <div className="w-full max-w-sm space-y-3 rounded-lg bg-background p-4 shadow-lg-950">
        <header className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold">Extra listing fee</h2>
          <button
            type="button"
            data-testid="listing-price-modal-close"
            onClick={onClose}
            className="text-sm text-muted-foreground"
          >
            Close
          </button>
        </header>
        <p className="text-sm text-muted-foreground">
          Your dealer subscription covers a set number of active listings.
          This listing is over that quota and adds ${LISTING_FEE_AMOUNT_USD}{" "}
          for the current billing period.
        </p>
        {done ? (
          <p
            data-testid="listing-price-modal-success"
            className="text-sm text-emerald-700 dark:text-emerald-400"
          >
            Charge complete. Listing activated.
          </p>
        ) : (
          <PaymentProcessingInterface
            amount={LISTING_FEE_AMOUNT_USD}
            label={`Activate listing ${listingId}`}
            onSubmit={submit}
          />
        )}
      </div>
    </div>
  );
}
