import "server-only";

import { nowIso, type BuildRecord } from "@/contracts";
import * as Storage from "@/services/team-15-storage";

// Single source for the bucket name so Team 9 writes and Team 12 reads line
// up. If this string changes, Team 12's onDepositReceived stops finding the
// BuildRecord and DealRecord.committedSpec ends up empty. The value is
// frozen against team-12-workflows.ts.
export const BUILD_RECORDS_BUCKET = "build_records";

export const getBuildRecord = (
  id: string,
): Promise<BuildRecord | null> =>
  Storage.getRecord<BuildRecord>(BUILD_RECORDS_BUCKET, id);

export const putBuildRecord = async (record: BuildRecord): Promise<void> => {
  await Storage.putRecord(BUILD_RECORDS_BUCKET, record.id, {
    ...record,
    updatedAt: nowIso(),
  });
};

export const listBuildRecordsForUser = async (
  userId: string,
): Promise<BuildRecord[]> => {
  const all = await Storage.listRecords<BuildRecord>(BUILD_RECORDS_BUCKET);
  return all
    .filter((r) => r.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export type BuildRecordAccess =
  | { ok: true; record: BuildRecord }
  | { ok: false; reason: "not-found" | "forbidden" };

// Pre-authz check for any action that reads or mutates a BuildRecord. Checkout
// uses this to verify that the current user is the owner before the deposit
// charge is placed.
export const loadBuildRecordForUser = async (input: {
  buildRecordId: string;
  userId: string;
}): Promise<BuildRecordAccess> => {
  const record = await getBuildRecord(input.buildRecordId);
  if (!record) return { ok: false, reason: "not-found" };
  if (record.userId !== input.userId) return { ok: false, reason: "forbidden" };
  return { ok: true, record };
};
