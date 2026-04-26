// Link Parser for "Found a Better Deal" feature
// Attempts to parse vehicle listing URLs and extract data

export interface ParsedListing {
  title: string;
  price: number;
  images: string[];
  year?: number;
  make?: string;
  model?: string;
  mileage?: number;
  source: string;
  url: string;
}

// Extract domain name from URL
function getSourceFromUrl(url: string): string {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    if (domain.includes('craigslist')) return 'Craigslist';
    if (domain.includes('facebook')) return 'Facebook Marketplace';
    if (domain.includes('autotrader')) return 'AutoTrader';
    if (domain.includes('cars.com')) return 'Cars.com';
    if (domain.includes('ebay')) return 'eBay Motors';
    if (domain.includes('letgo') || domain.includes('offerup')) return 'Local Marketplace';
    return domain;
  } catch {
    return 'Unknown Source';
  }
}

// Parse listing URL - attempts to extract structured data
export async function parseListing(url: string): Promise<ParsedListing | null> {
  try {
    // Validate URL
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    new URL(url);

    // In a real implementation, this would fetch and parse the actual page
    // For now, return a placeholder that can be overridden with manual input
    return {
      title: 'Listed Vehicle',
      price: 0,
      images: [],
      source: getSourceFromUrl(url),
      url: url,
    };
  } catch (error) {
    return null;
  }
}

// Create a Car object from parsed listing (for display through four-path system)
export function createCarFromParsedListing(
  parsed: ParsedListing,
  path: 'dealer' | 'auction' | 'picknbuild' | 'individual'
): any {
  return {
    id: `parsed-${Date.now()}`,
    make: parsed.make || 'Unknown',
    model: parsed.model || 'Make',
    year: parsed.year || new Date().getFullYear(),
    trim: '',
    image: parsed.images?.[0] || '/placeholder-car.jpg',
    mileage: parsed.mileage || 0,
    condition: 'good' as const,
    location: 'Pasted Listing',
    path: path,
    downPayment: 0,
    monthlyPayment: 0,
    totalCost: parsed.price,
    availability: 'Contact Seller',
    effort: 'high' as const,
    risk: 'medium' as const,
    fees: 0,
    source: parsed.source,
    explanation: `Listed on ${parsed.source} at ${new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parsed.price)}`,
    acv: parsed.price,
  };
}
