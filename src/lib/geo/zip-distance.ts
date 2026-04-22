const EARTH_RADIUS_MILES = 3958.7613;

const toRad = (deg: number) => (deg * Math.PI) / 180;

export const haversineMiles = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number => {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
};

/**
 * Minimal ZIP → (lat,lng) registry used by Distance Display while a full
 * centroid table is pending. Unknown ZIPs return `null`; callers fall back
 * to "— mi" in the UI rather than fabricating a number.
 */
const ZIP_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  "10001": { lat: 40.7506, lng: -73.9972 },
  "10016": { lat: 40.7448, lng: -73.9785 },
  "20001": { lat: 38.9122, lng: -77.0177 },
  "30303": { lat: 33.7525, lng: -84.3888 },
  "33101": { lat: 25.7743, lng: -80.1937 },
  "43210": { lat: 40.0067, lng: -83.0305 },
  "44114": { lat: 41.5133, lng: -81.6803 },
  "48201": { lat: 42.3485, lng: -83.0582 },
  "60601": { lat: 41.8864, lng: -87.6189 },
  "75201": { lat: 32.7873, lng: -96.7987 },
  "77002": { lat: 29.758, lng: -95.3659 },
  "85001": { lat: 33.4484, lng: -112.074 },
  "90001": { lat: 33.9731, lng: -118.2479 },
  "94102": { lat: 37.7793, lng: -122.4192 },
  "98101": { lat: 47.6107, lng: -122.3344 },
};

export const zipCentroid = (
  zip: string,
): { lat: number; lng: number } | null => ZIP_CENTROIDS[zip] ?? null;

export const distanceBetweenZips = (
  a: string | undefined | null,
  b: string | undefined | null,
): number | null => {
  if (!a || !b) return null;
  if (a === b) return 0;
  const ca = zipCentroid(a);
  const cb = zipCentroid(b);
  if (!ca || !cb) return null;
  return haversineMiles(ca, cb);
};

export const formatMiles = (miles: number | null): string => {
  if (miles === null) return "— mi";
  if (miles < 1) return "<1 mi";
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
};
