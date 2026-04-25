import "server-only";

export function getScraperUrl(): string {
  return process.env.SCRAPER_URL ?? "http://localhost:3099";
}

export interface ScraperFetchOptions {
  method?: "GET" | "POST";
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export class ScraperUnavailableError extends Error {
  constructor(public readonly cause: unknown) {
    super("Scraper service unavailable");
    this.name = "ScraperUnavailableError";
  }
}

export async function scraperFetch<T = unknown>(
  path: string,
  opts: ScraperFetchOptions = {}
): Promise<T> {
  const url = `${getScraperUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    opts.timeoutMs ?? 60_000
  );
  try {
    const res = await fetch(url, {
      method: opts.method ?? "GET",
      headers: opts.body ? { "Content-Type": "application/json" } : undefined,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal ?? controller.signal,
    });
    const text = await res.text();
    const json = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const message =
        (json && typeof json === "object" && "error" in json
          ? String(json.error)
          : null) ?? `Scraper ${res.status}`;
      throw new Error(message);
    }
    return json as T;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new ScraperUnavailableError("timeout");
    }
    if (
      err instanceof TypeError &&
      err.message.toLowerCase().includes("fetch failed")
    ) {
      throw new ScraperUnavailableError(err);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
