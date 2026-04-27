import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Orchestrator, log, getCuratedFeed } from "./core/index.js";
import type { UserPreferences } from "./core/index.js";
import { getActiveSites, closeDb } from "./core/db.js";
import { runDailyIngest, scheduleDailyIngest } from "./jobs/daily-ingest.js";

// Load env vars from parent picknbuild_mega/.env.local (preferred) or .env.
// Path: scraper/{src,dist}/server.{ts,js} → ../../.env(.local)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const candidate of [".env.local", ".env"]) {
  const envPath = path.resolve(__dirname, "..", "..", candidate);
  if (!fs.existsSync(envPath)) continue;
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
  log("info", `Loaded env from ${candidate}`);
  break;
}

// ─── Adapters ───────────────────────────────────────────────────────────────
import { CopartAdapter } from "./adapters/copart.js";
import { FirecrawlAdapter } from "./adapters/firecrawl.js";
import { matchRefreshRoute } from "./routes/refresh.js";
import { setOrchestrator } from "./core/refresh.js";

const PORT = parseInt(process.env.ORCH_PORT ?? "3099", 10);

// HEADLESS=false launches a visible Chromium window. Useful when Copart's
// Incapsula challenge stops accepting headless sessions — a real window with
// real input handling clears the challenge more reliably.
const headless = process.env.HEADLESS === "false" ? false : true;
const maxRetries = parseInt(process.env.ADAPTER_MAX_RETRIES ?? "3", 10);
log("info", `Adapter config: headless=${headless} maxRetries=${maxRetries}`);

const orchestrator = new Orchestrator({
  headless,
  maxRetries,
  maxPages: 3,
  pageSize: 20,
  delayBetweenRequests: 1500,
});

// Register built-in adapters
orchestrator.register(new CopartAdapter());

// Register IAAI adapter (built by Agent 1). Dynamic import so the server
// still starts if the file isn't present yet.
try {
  const iaaiModule: any = await import("./adapters/iaai.js");
  const iaai = iaaiModule.iaaiAdapter ?? iaaiModule.default;
  if (iaai) {
    orchestrator.register(iaai);
  } else {
    log("warn", "IAAI adapter module loaded but did not export iaaiAdapter");
  }
} catch (err: any) {
  log("warn", `IAAI adapter not registered (${err.code ?? err.message}) — curated feed will be Copart-only`);
}

// Give the refresh module a handle to the orchestrator so it can route
// getDetails() calls to the right adapter.
setOrchestrator(orchestrator);

// Register Firecrawl adapters from DB (sites with search_url_template).
// getActiveSites() is now async; await it before continuing.
try {
  const sites = await getActiveSites();
  for (const site of sites) {
    if (site.search_url_template) {
      const adapter = new FirecrawlAdapter(site.name, site.base_url, site.search_url_template);
      if (site.fc_specification) {
        adapter.setFcSpec(site.fc_specification);
      }
      orchestrator.register(adapter);
      log("info", `Registered Firecrawl adapter for ${site.name} (${site.base_url})`);
    }
  }
} catch (err: any) {
  log("warn", `Could not load sites from DB (first run?): ${err.message}`);
}

// ─── HTTP helpers ───────────────────────────────────────────────────────────

function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: string) => (body += chunk));
    req.on("end", () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { reject(new Error("Invalid JSON")); }
    });
    req.on("error", reject);
  });
}

function json(res: http.ServerResponse, status: number, data: any): void {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data));
}

// ─── Server ─────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  try {
    // ── Health / status ──
    if (url.pathname === "/health") {
      json(res, 200, {
        status: "ok",
        adapters: orchestrator.status(),
        uptime: process.uptime(),
      });
      return;
    }

    // ── Search (POST /search) ──
    if (url.pathname === "/search" && req.method === "POST") {
      const prefs: UserPreferences = await parseBody(req);
      log("info", `Search request: ${JSON.stringify(prefs)}`);

      const scored = await orchestrator.search(prefs);
      log("success", `Returning ${scored.length} vehicles`);

      json(res, 200, {
        success: true,
        total: scored.length,
        cars: scored,
        searchedAt: new Date().toISOString(),
      });
      return;
    }

    // ── Quick preview (GET /preview?make=Honda&model=Civic) ──
    if (url.pathname === "/preview") {
      const prefs: UserPreferences = {
        make: url.searchParams.get("make") ?? undefined,
        model: url.searchParams.get("model") ?? undefined,
        year: url.searchParams.get("year") ?? undefined,
      };

      const scored = await orchestrator.search(prefs);
      json(res, 200, {
        success: true,
        total: scored.length,
        cars: scored,
      });
      return;
    }

    // ── Single vehicle (GET /vehicle/:source/:id) ──
    const vehicleMatch = url.pathname.match(/^\/vehicle\/([^/]+)\/(.+)$/);
    if (vehicleMatch) {
      const [, source, sourceId] = vehicleMatch;
      const vehicle = await orchestrator.getDetails(source, sourceId);
      if (!vehicle) {
        json(res, 404, { error: "Vehicle not found" });
        return;
      }
      json(res, 200, { success: true, vehicle });
      return;
    }

    // ── Background refresh (POST /refresh/:id or /refresh/:source/:sid) ──
    if (await matchRefreshRoute(req, res, url)) return;

    // ─── Curated feed / Daily ingest ────────────────────────────────────
    // GET /curated?siteId=<uuid>&limit=20 — hottest-auctions feed
    if (url.pathname === "/curated" && req.method === "GET") {
      const siteId = url.searchParams.get("siteId") || undefined;
      const limitParam = url.searchParams.get("limit");
      const limit = limitParam
        ? Math.max(1, Math.min(100, parseInt(limitParam, 10)))
        : 20;
      const items = await getCuratedFeed(siteId, limit);
      json(res, 200, {
        success: true,
        total: items.length,
        items,
        fetchedAt: new Date().toISOString(),
      });
      return;
    }

    // POST /ingest/run — manually trigger the daily-ingest job
    if (url.pathname === "/ingest/run" && req.method === "POST") {
      log("info", "Manual ingest triggered");
      const results = await runDailyIngest(orchestrator);
      json(res, 200, { success: true, results, ranAt: new Date().toISOString() });
      return;
    }
    // ─── End curated/ingest section ──────────────────────────────────────

    json(res, 404, { error: "Not found" });
  } catch (err: any) {
    log("error", `Request failed: ${err.message}`);
    json(res, 500, { error: err.message });
  }
});

// ─── Start ──────────────────────────────────────────────────────────────────

server.listen(PORT, async () => {
  log("success", `Scrape Orchestrator running on http://localhost:${PORT}`);
  log("info", "Endpoints:");
  log("info", "  GET  /health              — Status + adapter readiness");
  log("info", "  POST /search              — Search all sources");
  log("info", "  GET  /preview             — Quick search via query params");
  log("info", "  GET  /vehicle/:source/:id — Single vehicle details");
  log("info", "  POST /refresh/:listingId  — Background re-scrape + diff");
  log("info", "  GET  /curated             — Hottest-auctions feed");
  log("info", "  POST /ingest/run          — Manually trigger daily ingest");
  log("info", "");
  log("info", "Initializing adapters...");
  await orchestrator.initAll();

  // Schedule the daily ingest cron (no-op if DISABLE_INGEST_CRON=1)
  scheduleDailyIngest(orchestrator);
});

process.on("SIGINT", async () => {
  log("info", "Shutting down...");
  await orchestrator.closeAll();
  closeDb();
  server.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await orchestrator.closeAll();
  closeDb();
  server.close();
  process.exit(0);
});

// Surface unhandled rejections so silent failures in fire-and-forget paths
// (orchestrator.persistResults, etc.) don't disappear into the void.
process.on("unhandledRejection", (reason) => {
  log("error", `Unhandled rejection: ${String(reason)}`);
});
