import { NextResponse } from "next/server";
import { requireCap } from "@/lib/authz/server/require-cap";
import { CAPABILITIES as C } from "@/lib/authz/capabilities";
import { scraperFetch, ScraperUnavailableError } from "@/lib/scraper/client";

export const GET = requireCap(C.listings.view)(async () => {
  try {
    const data = await scraperFetch("/health", { timeoutMs: 5_000 });
    return NextResponse.json({ ok: true, scraper: data });
  } catch (err) {
    if (err instanceof ScraperUnavailableError) {
      return NextResponse.json(
        { ok: false, reason: "scraper service not running" },
        { status: 503 }
      );
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, reason: message }, { status: 502 });
  }
});
