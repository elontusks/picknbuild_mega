/**
 * FC Specification management — the evolving per-site prompt that guides
 * Firecrawl extraction. Ported from athin-scraper/src/lib/scraper.ts.
 *
 * Each scrape_site has an fc_specification TEXT column. After every scrape
 * run, we append a timestamped note about what happened (success, partial,
 * failed) so the next extraction attempt can learn from previous ones.
 */

export interface FcSpecUpdate {
  success: boolean;
  missingFields?: string[];
  error?: string;
  url: string;
}

/**
 * Append a timestamped observation to an existing FC specification.
 * Returns the updated spec string.
 */
export function buildFcSpecUpdate(
  existingSpec: string | null,
  result: FcSpecUpdate
): string {
  const lines: string[] = [];

  if (existingSpec) {
    lines.push(existingSpec.trim());
    lines.push("");
  }

  const timestamp = new Date().toISOString().slice(0, 19);

  if (result.success && result.missingFields && result.missingFields.length > 0) {
    lines.push(
      `[${timestamp}] Partial extraction — missing fields: ${result.missingFields.join(", ")}. ` +
      `Try harder to find these fields on pages from this site.`
    );
  } else if (!result.success && result.error) {
    lines.push(
      `[${timestamp}] Scrape failed: ${result.error.slice(0, 200)}. ` +
      `URL pattern: ${extractPathPattern(result.url)}`
    );
  } else if (result.success) {
    lines.push(
      `[${timestamp}] Full extraction succeeded. URL pattern: ${extractPathPattern(result.url)}`
    );
  }

  return capSize(lines.join("\n"), 2000);
}

/**
 * Sanitize an FC specification before injecting it into a prompt.
 * Strips instruction-override patterns to prevent stored prompt injection.
 */
export function sanitizeFcSpec(spec: string): string {
  let clean = spec;

  const dangerousPatterns = [
    /ignore\s+(previous|above|all|prior)[\s\S]*/gi,
    /disregard\s+(previous|above|all|prior)[\s\S]*/gi,
    /new\s+instructions?:?[\s\S]*/gi,
    /system\s*prompt[\s\S]*/gi,
    /you\s+are\s+(now|a)[\s\S]*/gi,
    /\[INST\][\s\S]*?\[\/INST\]/gi,
    /<\|im_start\|>[\s\S]*?<\|im_end\|>/gi,
  ];

  for (const pattern of dangerousPatterns) {
    clean = clean.replace(pattern, "[removed]");
  }

  // Limit line length to prevent hidden payloads
  clean = clean
    .split("\n")
    .map((line) => (line.length > 300 ? line.slice(0, 300) + "..." : line))
    .join("\n");

  return clean;
}

/**
 * Build the full extraction prompt, optionally appending site-specific guidance.
 */
export function buildExtractionPrompt(fcSpec?: string | null): string {
  let prompt =
    "Extract all vehicle listing information from this page. " +
    "This is a car listing page from an auction site, dealer, or marketplace. " +
    "Return only factual data visible on the page. " +
    "For price fields, return numbers only (no $ or commas). " +
    "For mileage, return the number only. " +
    "For has_keys, return 'yes', 'no', or leave empty.";

  if (fcSpec) {
    prompt += `\n\nSite-specific extraction guidance:\n${sanitizeFcSpec(fcSpec)}`;
  }

  return prompt;
}

// ── Helpers ──

function extractPathPattern(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname
      .replace(/\/\d+/g, "/{id}")
      .replace(/\/[a-f0-9]{8,}/gi, "/{hash}");
  } catch {
    return "unknown";
  }
}

function capSize(spec: string, maxChars: number): string {
  if (spec.length <= maxChars) return spec;
  const lines = spec.split("\n");
  const result: string[] = [];
  let size = 0;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (size + lines[i].length + 1 > maxChars) break;
    result.unshift(lines[i]);
    size += lines[i].length + 1;
  }
  return result.join("\n");
}
