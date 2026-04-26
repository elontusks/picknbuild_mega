import { NextRequest, NextResponse } from "next/server";
import { loadSession } from "@/services/team-01-auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await loadSession();
  if (session.state !== "ready") {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    availableCash: session.user.budget || 0,
    creditScore: session.user.creditScore || 650,
    zip: session.user.zip,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await loadSession();
  if (session.state !== "ready") {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const supabase = await createClient();

    const update: {
      budget?: number | null;
      credit_score?: number | null;
      zip?: string;
    } = {};

    if (body.availableCash != null) {
      update.budget = body.availableCash;
    }
    if (body.creditScore != null) {
      update.credit_score = body.creditScore;
    }
    if (body.zip != null) {
      update.zip = body.zip;
    }

    const { error } = await supabase
      .from("profiles")
      .update(update)
      .eq("id", session.user.id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      availableCash: body.availableCash,
      creditScore: body.creditScore,
      zip: body.zip,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
