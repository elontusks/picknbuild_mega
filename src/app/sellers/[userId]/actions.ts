"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/services/team-01-auth";
import { openOrCreateThread } from "@/services/team-13-messaging";
import { loadUserById } from "@/lib/profiles/load-user";

const parseString = (v: FormDataEntryValue | null): string | undefined => {
  if (v == null) return undefined;
  const s = typeof v === "string" ? v.trim() : String(v).trim();
  return s.length > 0 ? s : undefined;
};

export async function openSellerThread(formData: FormData): Promise<void> {
  const viewer = await requireUser();
  const sellerId = parseString(formData.get("sellerId"));
  if (!sellerId) throw new Error("Missing sellerId.");

  const target = await loadUserById(sellerId);
  if (!target || target.role !== "seller") {
    throw new Error("Seller not found.");
  }

  const listingId = parseString(formData.get("listingId"));
  const thread = await openOrCreateThread({
    kind: "buyer-seller",
    participants: [viewer.id, sellerId],
    ...(listingId ? { listingId } : {}),
  });
  redirect(`/inbox/${thread.id}`);
}
