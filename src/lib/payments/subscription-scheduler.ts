import "server-only";

import { processSubscriptionRenewals } from "@/services/team-14-payments";

// Subscription scheduler for Mercury-based recurring charges.
// Call this daily/weekly to process renewals.
// Returns count of processed + failed renewals.

export type SchedulerResult = {
  processed: number;
  failed: number;
  error?: string;
};

export const runSubscriptionScheduler = async (): Promise<SchedulerResult> => {
  try {
    const result = await processSubscriptionRenewals();
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error("[scheduler] subscription renewal failed:", message);
    return {
      processed: 0,
      failed: 0,
      error: message,
    };
  }
};
