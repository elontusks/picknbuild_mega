import { NextRequest, NextResponse } from "next/server";
import { loadSession } from "@/services/team-01-auth";
import { createClient } from "@/lib/supabase/server";

type TitlePreference = "clean" | "rebuilt" | null;

function isValidTitlePreference(value: unknown): value is TitlePreference {
  return value === null || value === "clean" || value === "rebuilt";
}

export async function GET() {
  const session = await loadSession();
  if (session.state !== "ready") {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("title_preference")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const titlePreference = (data as { title_preference?: string | null } | null)
    ?.title_preference;

  return NextResponse.json({
    availableCash: session.user.budget || 0,
    creditScore: session.user.creditScore || 650,
    zip: session.user.zip,
    titleType: titlePreference ?? undefined,
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
      title_preference?: TitlePreference;
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
    if (Object.prototype.hasOwnProperty.call(body, "titleType")) {
      const raw = body.titleType;
      // Accept undefined as "no change", but null/'clean'/'rebuilt' as a write.
      if (raw === undefined) {
        // skip
      } else if (isValidTitlePreference(raw)) {
        update.title_preference = raw;
      } else {
        return NextResponse.json(
          { error: "titleType must be 'clean', 'rebuilt', or null" },
          { status: 400 }
        );
      }
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
      titleType: update.title_preference ?? undefined,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
