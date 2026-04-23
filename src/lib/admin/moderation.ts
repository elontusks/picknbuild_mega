import "server-only";

import { nowIso } from "@/contracts";
import * as Storage from "@/services/team-15-storage";

// Ad-hoc moderation ledger. ARCHITECTURE §7 drops the full "report queue"
// concept and §5 Team 15 narrows us to "Manual Moderation Actions" —
// one-off operator decisions. We persist each mutation as an audit row
// alongside admin_logs so an operator can see what they've done to a given
// target without scanning the full log stream.

export const MODERATION_LOG_BUCKET = "moderation_log";

export type ModerationTargetKind = "listing" | "user" | "deal_request";

export type ModerationLogEntry = {
  id: string;
  actor: string;
  targetKind: ModerationTargetKind;
  targetId: string;
  action: string;
  note?: string;
  occurredAt: string;
};

export const recordModerationAction = async (input: {
  actor: string;
  targetKind: ModerationTargetKind;
  targetId: string;
  action: string;
  note?: string;
}): Promise<ModerationLogEntry> => {
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? `mod_${crypto.randomUUID()}`
      : `mod_${Date.now()}`;
  const entry: ModerationLogEntry = {
    id,
    actor: input.actor,
    targetKind: input.targetKind,
    targetId: input.targetId,
    action: input.action,
    ...(input.note !== undefined ? { note: input.note } : {}),
    occurredAt: nowIso(),
  };
  await Storage.putRecord(MODERATION_LOG_BUCKET, entry.id, entry);
  return entry;
};

export const listModerationLog = async (): Promise<ModerationLogEntry[]> => {
  const rows =
    await Storage.listRecords<ModerationLogEntry>(MODERATION_LOG_BUCKET);
  return rows.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
};

export const listModerationLogForTarget = async (
  targetKind: ModerationTargetKind,
  targetId: string,
): Promise<ModerationLogEntry[]> => {
  const all = await listModerationLog();
  return all.filter(
    (r) => r.targetKind === targetKind && r.targetId === targetId,
  );
};
