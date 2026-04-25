import { NextResponse } from "next/server";
import { requireCap } from "@/lib/authz/server/require-cap";
import { CAPABILITIES as C } from "@/lib/authz/capabilities";
import { refreshListing as refreshListingService } from "@/services/team-03-supply";
import { scraperFetch, ScraperUnavailableError } from "@/lib/scraper/client";

type Ctx = { params: Promise<{ id: string }> };

interface ScraperRefreshResult {
  status: "success" | "unchanged" | "failed" | "debounced";
  changedFields?: unknown[];
  prev?: unknown;
  next?: unknown;
  durationMs?: number;
  error?: string;
}

const NON_SCRAPER_ERRORS = new Set([
  "no scrape_site_id (not a scraped listing)",
  "missing source_external_id",
]);

export const POST = requireCap<Ctx>(C.listings.view)(async (_req, ctx) => {
  const { id } = await ctx.params;

  // Try the scraper first — it handles copart/iaai/firecrawl rows by re-scraping
  // and diffing volatile fields. If the listing isn't a scraped row, fall back
  // to the team-03 service which just bumps lastRefreshedAt with cooldown logic.
  try {
    const data = await scraperFetch<ScraperRefreshResult>(`/refresh/${id}`, {
      method: "POST",
      timeoutMs: 35_000,
    });
    if (data.status !== "failed" || !NON_SCRAPER_ERRORS.has(data.error ?? "")) {
      return NextResponse.json(data);
    }
    // Scraped-listing path didn't apply — fall through to service.
  } catch (err) {
    if (!(err instanceof ScraperUnavailableError)) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        { status: "failed", error: message },
        { status: 502 }
      );
    }
    // Scraper service down — fall through to service so user/dealer listings
    // can still be refreshed without the worker running.
  }

  const result = await refreshListingService(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 404 });
  }
  return NextResponse.json({
    listing: result.listing,
    refreshed: result.refreshed,
    reason: result.reason,
  });
});
