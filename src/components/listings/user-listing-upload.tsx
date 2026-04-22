"use client";

import { ListingForm } from "./listing-form";
import type { ListingObject } from "@/contracts";

/**
 * User-Generated Listing Upload — the surface a signed-in individual seller
 * uses to list their own car. Writes a `ListingObject` with `source: "user"`
 * and `ownerUserId` = current user. Mounted on the Individual Seller Profile
 * (T2) and the Feed's "User Vehicle Upload Form" (T16).
 */
export function UserListingUpload({
  onCreated,
}: {
  onCreated?: (listing: ListingObject) => void;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">List your car</h2>
      <p className="text-sm text-neutral-600">
        Post the vehicle you want to sell. Buyers see your listing across search
        and in your profile.
      </p>
      <ListingForm mode="user" onCreated={onCreated} />
    </div>
  );
}
