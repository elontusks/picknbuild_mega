"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/services/team-01-auth";
import {
  getListing,
  markListingStatus,
  upsertDealerListing,
} from "@/services/team-03-supply";
import { openOrCreateThread } from "@/services/team-13-messaging";
import type { TitleStatus } from "@/contracts";

export type DealerListingFormState =
  | { status: "idle" }
  | { status: "error"; error: string; field?: string }
  | { status: "ok"; listingId: string };

const parseNumber = (v: FormDataEntryValue | null): number | undefined => {
  if (v == null || v === "") return undefined;
  const n = typeof v === "string" ? Number(v) : Number(String(v));
  return Number.isFinite(n) ? n : undefined;
};

const parseString = (v: FormDataEntryValue | null): string | undefined => {
  if (v == null) return undefined;
  const s = typeof v === "string" ? v.trim() : String(v).trim();
  return s.length > 0 ? s : undefined;
};

const parseTitleStatus = (v: FormDataEntryValue | null): TitleStatus | undefined => {
  const s = parseString(v);
  if (s === "clean" || s === "rebuilt" || s === "unknown") return s;
  return undefined;
};

/**
 * Used by Dealer Page Edit Panel. On create, sourceUrl is omitted so Team 3
 * derives a deterministic one from the dealer id. On edit, the existing
 * listing's sourceUrl is passed through so the upsert hits the same row.
 */
export async function saveDealerListing(
  _prev: DealerListingFormState,
  formData: FormData,
): Promise<DealerListingFormState> {
  const viewer = await requireUser();
  if (viewer.role !== "dealer") {
    return { status: "error", error: "Only dealers can edit dealer listings." };
  }

  const existingId = parseString(formData.get("listingId"));
  let existingSourceUrl: string | undefined;
  if (existingId) {
    const existing = await getListing(existingId);
    if (!existing) {
      return { status: "error", error: "Listing not found." };
    }
    if (existing.ownerUserId !== viewer.id || existing.source !== "dealer") {
      return { status: "error", error: "Not your listing." };
    }
    existingSourceUrl = existing.sourceUrl;
  }

  const result = await upsertDealerListing({
    ownerUserId: viewer.id,
    form: {
      year: parseNumber(formData.get("year")),
      make: parseString(formData.get("make")),
      model: parseString(formData.get("model")),
      trim: parseString(formData.get("trim")),
      mileage: parseNumber(formData.get("mileage")),
      price: parseNumber(formData.get("price")),
      vin: parseString(formData.get("vin")),
      titleStatus: parseTitleStatus(formData.get("titleStatus")),
      locationZip: parseString(formData.get("locationZip")),
      sourceUrl: existingSourceUrl,
    },
  });

  if (!result.ok) {
    return { status: "error", error: result.reason, field: result.field };
  }

  revalidatePath(`/dealers/${viewer.id}`);
  return { status: "ok", listingId: result.listing.id };
}

export async function removeDealerListing(formData: FormData): Promise<void> {
  const viewer = await requireUser();
  if (viewer.role !== "dealer") {
    throw new Error("Only dealers can remove dealer listings.");
  }
  const listingId = parseString(formData.get("listingId"));
  if (!listingId) throw new Error("Missing listingId.");

  const existing = await getListing(listingId);
  if (!existing) throw new Error("Listing not found.");
  if (existing.ownerUserId !== viewer.id || existing.source !== "dealer") {
    throw new Error("Not your listing.");
  }

  await markListingStatus(listingId, "removed");
  revalidatePath(`/dealers/${viewer.id}`);
}

export async function openDealerThread(formData: FormData): Promise<void> {
  const viewer = await requireUser();
  const dealerId = parseString(formData.get("dealerId"));
  if (!dealerId) throw new Error("Missing dealerId.");
  const listingId = parseString(formData.get("listingId"));

  const thread = await openOrCreateThread({
    kind: "buyer-dealer",
    participants: [viewer.id, dealerId],
    ...(listingId ? { listingId } : {}),
  });
  redirect(`/inbox/${thread.id}`);
}
