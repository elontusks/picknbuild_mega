import { NextResponse, type NextRequest } from "next/server";
import { requireCap } from "@/lib/authz/server/require-cap";
import { CAPABILITIES as C } from "@/lib/authz/capabilities";
import { scraperFetch, ScraperUnavailableError } from "@/lib/scraper/client";

export const GET = requireCap(C.listings.view)(async (req: NextRequest) => {
  const siteId = req.nextUrl.searchParams.get("siteId");
  const limit = req.nextUrl.searchParams.get("limit");
  const qs = new URLSearchParams();
  if (siteId) qs.set("siteId", siteId);
  if (limit) qs.set("limit", limit);
  const path = qs.toString() ? `/curated?${qs}` : "/curated";

  try {
    const data = await scraperFetch(path, { timeoutMs: 10_000 });
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof ScraperUnavailableError) {
      return NextResponse.json(
        { success: false, items: [], reason: "scraper service not running" },
        { status: 503 }
      );
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, items: [], reason: message },
      { status: 502 }
    );
  }
});
