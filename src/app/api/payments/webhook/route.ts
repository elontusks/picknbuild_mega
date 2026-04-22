import { NextResponse, type NextRequest } from "next/server";
import { verifyStripeWebhook } from "@/lib/payments/stripe-client";
import { handleWebhookEvent } from "@/services/team-14-payments";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json(
      { error: "webhook not configured" },
      { status: 400 },
    );
  }
  const payload = await req.text();
  let event;
  try {
    event = verifyStripeWebhook({ payload, signature, secret });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "signature-failed" },
      { status: 400 },
    );
  }
  const result = await handleWebhookEvent(event);
  return NextResponse.json(result, { status: 200 });
}
