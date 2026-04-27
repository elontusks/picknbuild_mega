import "server-only";

import { nowIso } from "@/contracts";
import * as Storage from "@/services/team-15-storage";

// Ingestion health: the scraper sidecar at scraper/ (port 3099) writes its
// own scrape_runs table for per-attempt audit, but the Admin Dashboard
// surface here is a wider heartbeat that any ingestion runner (scraper
// daily-ingest cron, dealer onboarding feed, manual reupload) can append to.
// Nothing writes this today; any future runner calls recordIngestionHeartbeat()
// and the Admin Dashboard surfaces the most-recent row. Missing bucket →
// "no runs yet" copy.

export const INGESTION_RUNS_BUCKET = "ingestion_runs";

export type IngestionRun = {
  id: string;
  source: string;
  status: "ok" | "degraded" | "error";
  ingested: number;
  note?: string;
  occurredAt: string;
};

export const recordIngestionHeartbeat = async (input: {
  source: string;
  status: IngestionRun["status"];
  ingested?: number;
  note?: string;
}): Promise<IngestionRun> => {
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? `ingest_${crypto.randomUUID()}`
      : `ingest_${Date.now()}`;
  const entry: IngestionRun = {
    id,
    source: input.source,
    status: input.status,
    ingested: input.ingested ?? 0,
    ...(input.note !== undefined ? { note: input.note } : {}),
    occurredAt: nowIso(),
  };
  await Storage.putRecord(INGESTION_RUNS_BUCKET, entry.id, entry);
  return entry;
};

export const listIngestionRuns = async (): Promise<IngestionRun[]> => {
  const rows = await Storage.listRecords<IngestionRun>(INGESTION_RUNS_BUCKET);
  return rows.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
};

export const getLatestIngestionRun = async (): Promise<IngestionRun | null> => {
  const runs = await listIngestionRuns();
  return runs[0] ?? null;
};
