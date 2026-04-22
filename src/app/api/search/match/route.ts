import { NextResponse, type NextRequest } from "next/server";
import { requireCap } from "@/lib/authz/server/require-cap";
import { CAPABILITIES as C } from "@/lib/authz/capabilities";
import { matchListings } from "@/services/team-11-intelligence";
import type { IntakeState, TitlePreference } from "@/contracts";

type Body = { intake: Partial<IntakeState> };

const TITLE_PREFS: readonly TitlePreference[] = ["clean", "rebuilt", "both"];

/**
 * Team 4 → Team 11 bridge for Match Mode. Takes the current IntakeState from
 * the client, hands it to the matching engine, returns the filtered list.
 */
export const POST = requireCap(C.listings.view)(async (req: NextRequest) => {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body || !body.intake) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const raw = body.intake;
  const titlePreference: TitlePreference = TITLE_PREFS.includes(
    raw.titlePreference as TitlePreference,
  )
    ? (raw.titlePreference as TitlePreference)
    : "both";

  const zip = raw.location?.zip;
  if (typeof zip !== "string" || zip.length === 0) {
    return NextResponse.json({ error: "ZIP required" }, { status: 400 });
  }

  const intake: IntakeState = {
    location: { zip },
    make: raw.make,
    model: raw.model,
    yearRange: raw.yearRange,
    mileageMax: raw.mileageMax,
    trim: raw.trim,
    cash: typeof raw.cash === "number" && Number.isFinite(raw.cash) ? raw.cash : 0,
    creditScore: raw.creditScore,
    noCredit: Boolean(raw.noCredit),
    titlePreference,
    matchMode: true,
    selectedTerm: raw.selectedTerm,
  };

  const listings = await matchListings(intake);
  return NextResponse.json({ listings });
});
