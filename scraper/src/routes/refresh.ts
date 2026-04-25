/**
 * HTTP route handlers for background-refresh.
 *
 * Routes:
 *   POST /refresh/:listingId                       — refresh by UUID
 *   POST /refresh/:source/:sourceListingId         — convenience lookup
 */

import http from "http";
import { refreshListing } from "../core/refresh.js";
import { getClient } from "../core/db.js";
import { log } from "../core/utils.js";

function json(res: http.ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data));
}

const SOURCE_TO_BASE_URL: Record<string, string> = {
  copart: "copart.com",
  iaai: "iaai.com",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function matchRefreshRoute(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  url: URL
): Promise<boolean> {
  if (req.method !== "POST") return false;
  if (!url.pathname.startsWith("/refresh/")) return false;

  // POST /refresh/:source/:sourceListingId — convenience form
  const convenience = url.pathname.match(/^\/refresh\/([^/]+)\/([^/]+)$/);
  if (convenience) {
    const [, source, sourceListingId] = convenience;
    if (!UUID_RE.test(source)) {
      const baseUrl = SOURCE_TO_BASE_URL[source.toLowerCase()] ?? source.toLowerCase();
      try {
        const c = getClient();
        const { data: site } = await c
          .from("scrape_sites")
          .select("id")
          .eq("base_url", baseUrl)
          .maybeSingle();
        if (!site) {
          json(res, 404, { status: "failed", error: `unknown source: ${source}` });
          return true;
        }
        const { data: row } = await c
          .from("listings")
          .select("id")
          .eq("scrape_site_id", site.id)
          .eq("source_external_id", sourceListingId)
          .maybeSingle();
        if (!row) {
          json(res, 404, {
            status: "failed",
            error: "listing not found for (source, sourceListingId)",
          });
          return true;
        }
        const result = await refreshListing(row.id);
        json(res, 200, result);
        return true;
      } catch (err) {
        log("error", `[refresh] lookup failed: ${String(err)}`);
        json(res, 500, { status: "failed", error: "lookup failed" });
        return true;
      }
    }
  }

  // POST /refresh/:uuid
  const byId = url.pathname.match(/^\/refresh\/([0-9a-f-]{36})$/i);
  if (byId) {
    const listingId = byId[1];
    try {
      const result = await refreshListing(listingId);
      json(res, 200, result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log("error", `[refresh] /refresh/${listingId} crashed: ${msg}`);
      json(res, 500, { status: "failed", error: msg });
    }
    return true;
  }

  return false;
}
