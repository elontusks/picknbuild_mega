import { NextResponse } from "next/server";
import { requireCap } from "@/lib/authz/server/require-cap";
import { CAPABILITIES as C } from "@/lib/authz/capabilities";
import { estimateAlreadyHaveACar } from "@/services/team-11-pricing";

type Body = {
  vin?: string;
  fallback?: {
    year?: number;
    make?: string;
    model?: string;
    mileage?: number;
    trim?: string;
  };
  requestedWork?: string[];
};

const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/i;

export const POST = requireCap(C.listings.view)(async (req) => {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const requestedWork = Array.isArray(body.requestedWork)
    ? body.requestedWork.filter((s): s is string => typeof s === "string")
    : [];

  const input: Parameters<typeof estimateAlreadyHaveACar>[0] = { requestedWork };

  if (body.vin) {
    if (!VIN_PATTERN.test(body.vin)) {
      return NextResponse.json(
        { error: "Valid 17-character VIN required", reason: "invalid-vin" },
        { status: 400 },
      );
    }
    input.vin = body.vin.toUpperCase();
  } else if (body.fallback) {
    const { year, make, model, mileage, trim } = body.fallback;
    if (
      typeof year !== "number" ||
      typeof make !== "string" ||
      typeof model !== "string"
    ) {
      return NextResponse.json(
        {
          error: "fallback requires year/make/model",
          reason: "missing-fallback",
        },
        { status: 400 },
      );
    }
    const fallback: NonNullable<
      Parameters<typeof estimateAlreadyHaveACar>[0]["fallback"]
    > = { year, make, model };
    if (typeof mileage === "number") fallback.mileage = mileage;
    if (typeof trim === "string") fallback.trim = trim;
    input.fallback = fallback;
  } else {
    return NextResponse.json(
      { error: "Provide vin or fallback", reason: "missing-identifier" },
      { status: 400 },
    );
  }

  const result = await estimateAlreadyHaveACar(input);
  if (!result.ok) {
    return NextResponse.json({ ok: false, reason: result.reason });
  }
  return NextResponse.json({
    ok: true,
    estimate: result.estimate,
    assumptions: result.assumptions,
  });
});
