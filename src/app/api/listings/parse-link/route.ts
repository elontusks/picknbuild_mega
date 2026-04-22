import { NextResponse } from "next/server";
import { requireCap } from "@/lib/authz/server/require-cap";
import { CAPABILITIES as C } from "@/lib/authz/capabilities";
import { parseLink, submitManualFallback } from "@/services/team-03-supply";

type ParseBody =
  | { url: string; manual?: undefined }
  | {
      url?: string;
      manual: {
        year: number;
        make: string;
        model: string;
        trim?: string;
        mileage?: number;
        price?: number;
        vin?: string;
        titleStatus?: "clean" | "rebuilt" | "unknown";
        photos?: string[];
      };
    };

export const POST = requireCap(C.listings.view)(async (req, _ctx, principal) => {
  const body = (await req.json().catch(() => null)) as ParseBody | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if ("manual" in body && body.manual) {
    const result = await submitManualFallback(
      { url: body.url, ...body.manual },
      principal.id,
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    return NextResponse.json({ listing: result.listing }, { status: 201 });
  }

  if (!body.url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }
  const result = await parseLink(body.url, principal.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }
  return NextResponse.json({ listing: result.listing }, { status: 201 });
});
