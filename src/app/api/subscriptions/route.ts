import { NextResponse, type NextRequest } from "next/server";
import { loadPrincipal } from "@/lib/authz/server/principal-loader";
import {
  cancelSubscription,
  startSubscription,
  type SubscriptionPlan,
} from "@/services/team-14-payments";

type StartBody = {
  plan?: SubscriptionPlan;
  email?: string;
  stripeCustomerId?: string;
};

const VALID_PLANS: SubscriptionPlan[] = ["dealer-basic", "dealer-pro"];

export async function POST(req: NextRequest) {
  const principal = await loadPrincipal();
  if (!principal) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  if (!principal.roles.includes("dealer")) {
    return NextResponse.json({ error: "dealer-only" }, { status: 403 });
  }
  const body = (await req.json().catch(() => null)) as StartBody | null;
  if (!body?.plan || !VALID_PLANS.includes(body.plan)) {
    return NextResponse.json({ error: "invalid plan" }, { status: 400 });
  }
  try {
    const subscription = await startSubscription({
      userId: principal.id,
      plan: body.plan,
      email: body.email,
      stripeCustomerId: body.stripeCustomerId,
    });
    return NextResponse.json({ subscription }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "start-failed" },
      { status: 502 },
    );
  }
}

type CancelBody = { atPeriodEnd?: boolean };

export async function DELETE(req: NextRequest) {
  const principal = await loadPrincipal();
  if (!principal) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  if (!principal.roles.includes("dealer")) {
    return NextResponse.json({ error: "dealer-only" }, { status: 403 });
  }
  const body =
    (await req.json().catch(() => ({}))) as CancelBody | null;
  try {
    const subscription = await cancelSubscription({
      userId: principal.id,
      atPeriodEnd: body?.atPeriodEnd ?? true,
    });
    return NextResponse.json({ subscription }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "cancel-failed" },
      { status: 502 },
    );
  }
}
