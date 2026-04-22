"use client";

import { useActionState, useState } from "react";
import type { ListingObject } from "@/contracts";
import {
  saveDealerListing,
  type DealerListingFormState,
} from "@/app/dealers/[userId]/actions";

type Props = {
  listing?: ListingObject;
  onSaved?: (listingId: string) => void;
};

const INITIAL: DealerListingFormState = { status: "idle" };

const fieldLabel =
  "block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400";
const fieldInput =
  "w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white";

export function DealerListingForm({ listing, onSaved }: Props) {
  const [state, formAction, pending] = useActionState(saveDealerListing, INITIAL);
  const [resetKey, setResetKey] = useState(0);

  if (state.status === "ok" && onSaved) {
    onSaved(state.listingId);
  }

  return (
    <form
      key={resetKey}
      action={formAction}
      data-testid={listing ? "dealer-listing-edit-form" : "dealer-listing-new-form"}
      className="grid gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800 sm:grid-cols-2"
    >
      {listing ? (
        <input type="hidden" name="listingId" defaultValue={listing.id} />
      ) : null}

      <label className="space-y-1">
        <span className={fieldLabel}>Year</span>
        <input
          className={fieldInput}
          name="year"
          type="number"
          required
          defaultValue={listing?.year}
        />
      </label>

      <label className="space-y-1">
        <span className={fieldLabel}>Make</span>
        <input
          className={fieldInput}
          name="make"
          required
          defaultValue={listing?.make}
        />
      </label>

      <label className="space-y-1">
        <span className={fieldLabel}>Model</span>
        <input
          className={fieldInput}
          name="model"
          required
          defaultValue={listing?.model}
        />
      </label>

      <label className="space-y-1">
        <span className={fieldLabel}>Trim</span>
        <input
          className={fieldInput}
          name="trim"
          defaultValue={listing?.trim ?? ""}
        />
      </label>

      <label className="space-y-1">
        <span className={fieldLabel}>Mileage</span>
        <input
          className={fieldInput}
          name="mileage"
          type="number"
          defaultValue={listing?.mileage ?? ""}
        />
      </label>

      <label className="space-y-1">
        <span className={fieldLabel}>Price (USD)</span>
        <input
          className={fieldInput}
          name="price"
          type="number"
          required
          defaultValue={listing?.price ?? ""}
        />
      </label>

      <label className="space-y-1">
        <span className={fieldLabel}>VIN</span>
        <input
          className={fieldInput}
          name="vin"
          defaultValue={listing?.vin ?? ""}
        />
      </label>

      <label className="space-y-1">
        <span className={fieldLabel}>Location ZIP</span>
        <input
          className={fieldInput}
          name="locationZip"
          defaultValue={listing?.locationZip ?? ""}
        />
      </label>

      <label className="space-y-1 sm:col-span-2">
        <span className={fieldLabel}>Title status</span>
        <select
          className={fieldInput}
          name="titleStatus"
          defaultValue={listing?.titleStatus ?? "clean"}
        >
          <option value="clean">Clean</option>
          <option value="rebuilt">Rebuilt</option>
          <option value="unknown">Unknown</option>
        </select>
      </label>

      {state.status === "error" ? (
        <p
          data-testid="dealer-listing-form-error"
          className="sm:col-span-2 text-sm text-rose-600 dark:text-rose-400"
        >
          {state.error}
          {state.field ? ` (${state.field})` : ""}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2 sm:col-span-2">
        {!listing && state.status === "ok" ? (
          <button
            type="button"
            onClick={() => setResetKey((k) => k + 1)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
          >
            Add another
          </button>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          data-testid="dealer-listing-save"
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          {pending ? "Saving…" : listing ? "Save changes" : "Post listing"}
        </button>
      </div>
    </form>
  );
}
