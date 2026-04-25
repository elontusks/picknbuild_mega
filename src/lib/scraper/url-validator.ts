/**
 * URL validation, domain extraction, and prompt injection protection
 * for the scraper pipeline.
 */

// Known car listing domains and their display names / site types
const KNOWN_CAR_SITES: Record<string, { name: string; siteType: string }> = {
  "copart.com": { name: "Copart", siteType: "auction" },
  "iaai.com": { name: "IAAI", siteType: "auction" },
  "facebook.com": { name: "Facebook Marketplace", siteType: "marketplace" },
  "cars.com": { name: "Cars.com", siteType: "dealer" },
  "autotrader.com": { name: "AutoTrader", siteType: "dealer" },
  "cargurus.com": { name: "CarGurus", siteType: "dealer" },
  "carfax.com": { name: "Carfax", siteType: "dealer" },
  "truecar.com": { name: "TrueCar", siteType: "dealer" },
  "edmunds.com": { name: "Edmunds", siteType: "dealer" },
  "carvana.com": { name: "Carvana", siteType: "dealer" },
  "vroom.com": { name: "Vroom", siteType: "dealer" },
  "bring-a-trailer.com": { name: "Bring a Trailer", siteType: "auction" },
  "bringatrailer.com": { name: "Bring a Trailer", siteType: "auction" },
  "mecum.com": { name: "Mecum Auctions", siteType: "auction" },
  "barrett-jackson.com": { name: "Barrett-Jackson", siteType: "auction" },
  "offerup.com": { name: "OfferUp", siteType: "marketplace" },
  "craigslist.org": { name: "Craigslist", siteType: "marketplace" },
};

// Patterns that indicate prompt injection attempts in URLs
const INJECTION_PATTERNS: RegExp[] = [
  // Direct instruction patterns
  /ignore\s+(previous|above|all|prior)/i,
  /disregard\s+(previous|above|all|prior)/i,
  /forget\s+(previous|above|all|prior)/i,
  /new\s+instructions?/i,
  /system\s*prompt/i,
  /you\s+are\s+(now|a)/i,
  /act\s+as\s/i,
  /pretend\s+(to|you)/i,
  /role\s*play/i,
  // LLM-specific injection tokens
  /\[INST\]/i,
  /\[\/INST\]/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /<<\s*SYS\s*>>/i,
  /\{\{.*\}\}/,
  // Markdown/formatting injection
  /```\s*(system|assistant|user)/i,
  // Encoded instruction attempts (double-encoded, unicode tricks)
  /%00/,           // null bytes
  /%0[aAdD]/,      // newline injection
];

export interface ValidationResult {
  valid: boolean;
  error?: string;
  url?: string;         // cleaned URL
  baseUrl?: string;     // e.g. "copart.com"
  knownSite?: { name: string; siteType: string };
}

/**
 * Validates and sanitizes a user-provided URL for scraping.
 * Returns a cleaned URL + extracted domain info, or an error.
 */
export function validateScrapeUrl(raw: string): ValidationResult {
  const input = raw.trim();

  if (!input) {
    return { valid: false, error: "URL is required" };
  }

  // Length check — no legitimate car listing URL should exceed this
  if (input.length > 2048) {
    return { valid: false, error: "URL is too long" };
  }

  // Check for prompt injection BEFORE parsing (catches encoded payloads in the raw string)
  const decoded = safeDecodeUri(input);
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(decoded) || pattern.test(input)) {
      return { valid: false, error: "URL contains disallowed content" };
    }
  }

  // Parse as URL
  let parsed: URL;
  try {
    // If user didn't include protocol, prepend https://
    const withProtocol = /^https?:\/\//i.test(input) ? input : `https://${input}`;
    parsed = new URL(withProtocol);
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }

  // Protocol check — only HTTPS (and HTTP for local dev)
  if (!["https:", "http:"].includes(parsed.protocol)) {
    return { valid: false, error: "Only HTTP/HTTPS URLs are supported" };
  }

  // Block internal/private addresses
  const hostname = parsed.hostname.toLowerCase();
  if (isPrivateHost(hostname)) {
    return { valid: false, error: "Internal/private URLs are not allowed" };
  }

  // Must have a real TLD (at least one dot in hostname)
  if (!hostname.includes(".")) {
    return { valid: false, error: "URL must have a valid domain" };
  }

  // Extract the registrable domain (e.g., "www.copart.com" → "copart.com")
  const baseUrl = extractBaseDomain(hostname);

  // Check if it's a known car listing site
  const knownSite = KNOWN_CAR_SITES[baseUrl];

  // Build the clean URL (strip fragments, keep path + query)
  const cleanUrl = `${parsed.protocol}//${parsed.host}${parsed.pathname}${parsed.search}`;

  return {
    valid: true,
    url: cleanUrl,
    baseUrl,
    knownSite,
  };
}

/**
 * Extracts the base registrable domain from a hostname.
 * "www.copart.com" → "copart.com"
 * "sale.iaai.com" → "iaai.com"
 */
function extractBaseDomain(hostname: string): string {
  const parts = hostname.split(".");
  // Handle two-part TLDs like .co.uk
  const twoPartTlds = ["co.uk", "com.au", "co.nz", "co.za"];
  if (parts.length >= 3) {
    const lastTwo = parts.slice(-2).join(".");
    if (twoPartTlds.includes(lastTwo)) {
      return parts.slice(-3).join(".");
    }
  }
  return parts.slice(-2).join(".");
}

/**
 * Checks if a hostname points to a private/internal address.
 */
function isPrivateHost(hostname: string): boolean {
  const blocked = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
    "[::1]",
    "169.254.",     // link-local
    "10.",          // private class A
    "192.168.",     // private class C
  ];
  return blocked.some(
    (b) => hostname === b || hostname.startsWith(b)
  ) || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);
}

/**
 * Safely decode a URI, handling double-encoding and malformed sequences.
 */
function safeDecodeUri(uri: string): string {
  try {
    let decoded = uri;
    // Decode up to 3 times to catch double/triple encoding
    for (let i = 0; i < 3; i++) {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    }
    return decoded;
  } catch {
    return uri;
  }
}
