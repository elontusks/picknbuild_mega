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
 * Persists the current configurator state to bucket "build_records".
 *
 * Id handling: either the caller forwards a buildRecordId that already
 * resolves to a row they own (reuse), or the server mints a fresh id
 * (create). The "buildRecordId provided but row does not exist" branch is
 * rejected — we never auto-claim an attacker-chosen id, otherwise a user
 * could grab a future sequential id out from under another caller.
 */
export async function saveBuildDraft(
  input: SaveBuildInput,
): Promise<SaveBuildResult> {
  const viewer = await requireUser();

  let base: BuildRecord;
  if (input.buildRecordId) {
    const existing = await getBuildRecord(input.buildRecordId);
    if (!existing) {
      return { ok: false, error: "Build record not found." };
    }
    if (existing.userId !== viewer.id) {
      return { ok: false, error: "Not your build record." };
    }
    base = existing;
  } else {
    // Server owns id minting. Client cannot seed this value.
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
