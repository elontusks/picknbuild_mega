"use client";

import { useState, useTransition } from "react";
import {
  markListingStaleAction,
  removeListingAction,
} from "@/app/admin/actions";
import type { ListingStatus } from "@/contracts";

export function ListingModerationPanel({
  listingId,
  currentStatus,
}: {
  listingId: string;
  currentStatus: ListingStatus;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const onRemove = () =>
    startTransition(async () => {
      const res = await removeListingAction({
        listingId,
        ...(note ? { note } : {}),
      });
      setMessage(res.ok ? "Listing removed." : `Error: ${res.error}`);
    });

  const onMarkStale = () =>
    startTransition(async () => {
      const res = await markListingStaleAction({ listingId });
      setMessage(res.ok ? "Listing marked stale." : `Error: ${res.error}`);
    });

  return (
    <div
      data-testid="admin-listing-moderation"
      className="flex flex-col gap-2 rounded-md border border-border p-3-800"
    >
      <h3 className="text-sm font-semibold">Manual moderation</h3>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional)"
        className="rounded-md border border-border px-2 py-1 text-xs-800"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending || currentStatus === "removed"}
          onClick={onRemove}
          className="rounded-md bg-red-600 px-3 py-1 text-xs text-primary-foreground disabled:opacity-50"
        >
          Remove
        </button>
        <button
          type="button"
          disabled={pending || currentStatus === "stale"}
          onClick={onMarkStale}
          className="rounded-md border border-border px-3 py-1 text-xs disabled:opacity-50-700"
        >
          Mark stale
        </button>
      </div>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
