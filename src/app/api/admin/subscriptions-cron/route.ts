import { NextResponse, type NextRequest } from "next/server";
import { runSubscriptionScheduler } from "@/lib/payments/subscription-scheduler";

// Subscription renewal cron handler for Vercel Cron Jobs.
// Runs daily to process subscription renewals.
//
// For Vercel deployment, add to vercel.json:
// {
//   "crons": [{
//     "path": "/api/admin/subscriptions-cron",
//     "schedule": "0 2 * * *"  // 2 AM UTC daily
//   }]
// }
//
// Vercel automatically validates cron requests with x-vercel-cron header.
// For local testing, call with: curl -H "x-vercel-cron: true" http://localhost:3000/api/admin/subscriptions-cron

export async function POST(req: NextRequest): Promise<Response> {
  // Verify this is a legitimate Vercel cron request (or local testing)
  const vercelCron = req.headers.get("x-vercel-cron");
  const isProduction = process.env.VERCEL_ENV === "production";

  if (isProduction && !vercelCron) {
    return NextResponse.json(
      { error: "unauthorized — not a cron request" },
      { status: 401 },
    );
  }

  try {
    console.log("[subscriptions-cron] running renewal scheduler...");
    const result = await runSubscriptionScheduler();

    return NextResponse.json(
      {
        ok: true,
        processed: result.processed,
        failed: result.failed,
        timestamp: new Date().toISOString(),
        ...(result.error ? { warning: result.error } : {}),
      },
      { status: result.error ? 207 : 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error("[subscriptions-cron] error:", message);
    return NextResponse.json(
      { error: message, ok: false },
      { status: 500 },
    );
  }
}
