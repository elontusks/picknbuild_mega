import { NextResponse, type NextRequest } from "next/server";
import { runSubscriptionScheduler } from "@/lib/payments/subscription-scheduler";

// Admin-only cron endpoint for subscription renewal processing.
// Protected by X-Cron-Secret header in production.
//
// Call this daily/weekly to process subscription renewals.
// Ideal trigger: external cron service (Upstash, AWS EventBridge, etc.)

const CRON_SECRET = process.env.ADMIN_CRON_SECRET;

export async function POST(req: NextRequest): Promise<Response> {
  // Validate cron secret in production
  if (process.env.NODE_ENV === "production") {
    const headerSecret = req.headers.get("x-cron-secret");
    if (!CRON_SECRET || headerSecret !== CRON_SECRET) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401 },
      );
    }
  }

  try {
    const result = await runSubscriptionScheduler();
    return NextResponse.json(
      {
        ok: true,
        processed: result.processed,
        failed: result.failed,
        ...(result.error ? { error: result.error } : {}),
      },
      { status: result.error ? 207 : 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error("[subscriptions-cron]", message);
    return NextResponse.json(
      { error: message, ok: false },
      { status: 500 },
    );
  }
}
