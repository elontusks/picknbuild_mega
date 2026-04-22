"use server";

import { revalidatePath } from "next/cache";
import {
  makeFixtureBuildRecord,
  nowIso,
  type BuildAttachment,
  type BuildCustomizations,
  type BuildRecord,
  type PackageTier,
} from "@/contracts";
import { requireUser } from "@/services/team-01-auth";
import {
  getBuildRecord,
  loadBuildRecordForUser,
  putBuildRecord,
} from "@/lib/build-records/storage";

export type SaveBuildInput = {
  buildRecordId?: string;
  listingId?: string;
  selectedPackage?: PackageTier;
  customizations?: BuildCustomizations;
  attachments?: BuildAttachment[];
};

export type SaveBuildResult =
  | { ok: true; buildRecordId: string }
  | { ok: false; error: string };

/**
 * Persists the current configurator state to bucket "build_records". Reuses
 * the incoming id so Team 5's draft BuildRecord (created client-side in
 * build-record-store.tsx) survives the hydration into the configurator and
 * the same row is updated — not duplicated — when Team 12's
 * onDepositReceived resolves it after the deposit charge succeeds.
 */
export async function saveBuildDraft(
  input: SaveBuildInput,
): Promise<SaveBuildResult> {
  const viewer = await requireUser();

  let base: BuildRecord;
  if (input.buildRecordId) {
    const existing = await getBuildRecord(input.buildRecordId);
    if (existing && existing.userId !== viewer.id) {
      return { ok: false, error: "Not your build record." };
    }
    base =
      existing ??
      makeFixtureBuildRecord({
        id: input.buildRecordId,
        userId: viewer.id,
      });
  } else {
    base = makeFixtureBuildRecord({ userId: viewer.id });
  }

  const next: BuildRecord = {
    ...base,
    userId: viewer.id,
    listingId: input.listingId ?? base.listingId,
    selectedPackage: input.selectedPackage ?? base.selectedPackage,
    customizations: input.customizations ?? base.customizations,
    attachments: input.attachments ?? base.attachments,
    updatedAt: nowIso(),
  };

  await putBuildRecord(next);
  revalidatePath(`/configurator`);
  if (next.listingId) {
    revalidatePath(`/configurator/${next.listingId}`);
  }
  return { ok: true, buildRecordId: next.id };
}

export type LoadBuildDraftResult =
  | { ok: true; build: BuildRecord }
  | { ok: false; reason: "not-found" | "forbidden" };

export async function loadBuildDraft(
  buildRecordId: string,
): Promise<LoadBuildDraftResult> {
  const viewer = await requireUser();
  const result = await loadBuildRecordForUser({
    buildRecordId,
    userId: viewer.id,
  });
  if (!result.ok) return { ok: false, reason: result.reason };
  return { ok: true, build: result.record };
}
