import "server-only";

import { nowIso } from "@/contracts";
import * as Storage from "./team-15-storage";

// Team 15 — System Logging Interface.
//
// Publishes a single surface (`logEvent`) that writes audit rows to the
// `admin_logs` bucket. Consumed today by Team 15's own admin server actions;
// exported for any other team that wants to record a durable operator
// trace. Reads go through listAdminLogs() below, powering the Monitoring
// Dashboard.

export const ADMIN_LOGS_BUCKET = "admin_logs";

export type AdminLogEntry = {
  id: string;
  actor: string;
  action: string;
  target?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type LogEventInput = {
  actor: string;
  action: string;
  target?: string;
  metadata?: Record<string, unknown>;
};

const newId = (): string => {
  const rand =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return `log_${rand}`;
};

export const logEvent = async (input: LogEventInput): Promise<AdminLogEntry> => {
  const entry: AdminLogEntry = {
    id: newId(),
    actor: input.actor,
    action: input.action,
    ...(input.target !== undefined ? { target: input.target } : {}),
    ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
    createdAt: nowIso(),
  };
  await Storage.putRecord(ADMIN_LOGS_BUCKET, entry.id, entry);
  return entry;
};

export const listAdminLogs = async (): Promise<AdminLogEntry[]> => {
  const all = await Storage.listRecords<AdminLogEntry>(ADMIN_LOGS_BUCKET);
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};
