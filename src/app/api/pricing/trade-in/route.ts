import { NextResponse } from "next/server";
import { requireCap } from "@/lib/authz/server/require-cap";
import { CAPABILITIES as C } from "@/lib/authz/capabilities";
import { estimateTradeInValue } from "@/services/team-11-pricing";
import type { TitleStatus } from "@/contracts";

type Body = {
  vin?: string;
  titleStatus?: TitleStatus;
  year?: number;
  mileage?: number;
};

const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/i;

export const POST = requireCap(C.listings.view)(async (req) => {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.vin || !VIN_PATTERN.test(body.vin)) {
    return NextResponse.json(
      { error: "Valid 17-character VIN required" },
      { status: 400 },
    );
  }
  if (body.titleStatus !== "clean" && body.titleStatus !== "rebuilt") {
    return NextResponse.json(
      { error: "titleStatus must be 'clean' or 'rebuilt'" },
      { status: 400 },
    );
  }
  const input: {
    vin: string;
    titleStatus: Extract<TitleStatus, "clean" | "rebuilt">;
    year?: number;
    mileage?: number;
  } = {
    vin: body.vin.toUpperCase(),
    titleStatus: body.titleStatus,
  };
  if (typeof body.year === "number") input.year = body.year;
  if (typeof body.mileage === "number") input.mileage = body.mileage;
  const { estimatedTradeInValue: value } = await estimateTradeInValue(input);
  return NextResponse.json({ estimatedTradeInValue: value });
});
