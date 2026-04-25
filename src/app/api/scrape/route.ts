import { NextResponse, type NextRequest } from "next/server";
import { requireCap } from "@/lib/authz/server/require-cap";
import { CAPABILITIES as C } from "@/lib/authz/capabilities";
import { scraperFetch, ScraperUnavailableError } from "@/lib/scraper/client";
import { validateScrapeUrl } from "@/lib/scraper/url-validator";

interface ScrapeBody {
  url?: string;
  make?: string;
  model?: string;
  year?: number | string;
  mileage?: number | string;
  price?: number | string;
  titleStatus?: string;
  state?: string;
}

/**
 * POST /api/scrape — proxies to the orchestrator's POST /search endpoint when
 * search filters are passed. If a single URL is passed, this is reserved for a
 * future single-URL Firecrawl ingest path; right now it returns a clear 501.
 */
export const POST = requireCap(C.listings.create)(async (req: NextRequest) => {
  const body = (await req.json().catch(() => null)) as ScrapeBody | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.url) {
    const validation = validateScrapeUrl(body.url);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    return NextResponse.json(
      {
        error:
          "Single-URL ingest not yet wired in this build. Use /api/scrape with search filters (make/model/year) to run the orchestrator's multi-source search.",
      },
      { status: 501 }
    );
  }

  try {
    const data = await scraperFetch("/search", {
      method: "POST",
      body: {
        make: body.make,
        model: body.model,
        year: body.year,
        mileage: body.mileage,
        price: body.price,
        titleStatus: body.titleStatus,
        state: body.state,
      },
      timeoutMs: 90_000,
    });
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof ScraperUnavailableError) {
      return NextResponse.json(
        { error: "scraper service not running" },
        { status: 503 }
      );
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
});
