import { NormalizedVehicle, ScoredVehicle, UserPreferences } from "./types.js";
import { log } from "./utils.js";

/**
 * Rough repair cost estimate based on damage description.
 * Shared across all sources — damage strings are normalized before scoring.
 */
function estimateRepairCost(damageType?: string): number {
  if (!damageType) return 5000;
  const d = damageType.toUpperCase();

  if (d.includes("MINOR") || d.includes("NORMAL WEAR")) return 2000;
  if (d.includes("HAIL")) return 3000;
  if (d.includes("REAR END")) return 4500;
  if (d.includes("SIDE")) return 5000;
  if (d.includes("FRONT END")) return 6000;
  if (d.includes("ROLLOVER")) return 8000;
  if (d.includes("FLOOD") || d.includes("WATER")) return 7000;
  if (d.includes("FIRE") || d.includes("BURN")) return 10000;
  if (d.includes("MECHANICAL") || d.includes("ENGINE")) return 5500;
  if (d.includes("ELECTRICAL")) return 4000;
  if (d.includes("VANDALISM")) return 3500;
  if (d.includes("THEFT")) return 4000;
  if (d.includes("ALL OVER")) return 9000;
  if (d.includes("BIOHAZARD")) return 6000;

  return 5000;
}

// US state → neighboring states for proximity scoring
const NEARBY_STATES: Record<string, string[]> = {
  AL: ["AL", "FL", "GA", "TN", "MS"],
  AK: ["AK", "WA"],
  AZ: ["AZ", "CA", "NV", "NM", "UT", "CO"],
  AR: ["AR", "TX", "LA", "MS", "TN", "MO", "OK"],
  CA: ["CA", "AZ", "NV", "OR"],
  CO: ["CO", "NM", "UT", "WY", "KS", "NE", "AZ"],
  CT: ["CT", "NY", "MA", "RI", "NJ"],
  DE: ["DE", "MD", "NJ", "PA"],
  DC: ["DC", "MD", "VA"],
  FL: ["FL", "GA", "AL", "SC"],
  GA: ["GA", "FL", "SC", "AL", "TN", "NC"],
  HI: ["HI", "CA"],
  ID: ["ID", "WA", "OR", "MT", "WY", "UT", "NV"],
  IL: ["IL", "IN", "WI", "MO", "IA", "KY"],
  IN: ["IN", "IL", "OH", "MI", "KY"],
  IA: ["IA", "MN", "WI", "IL", "MO", "NE", "SD"],
  KS: ["KS", "MO", "NE", "OK", "CO"],
  KY: ["KY", "TN", "OH", "IN", "IL", "WV", "VA"],
  LA: ["LA", "TX", "MS", "AR"],
  ME: ["ME", "NH", "MA"],
  MD: ["MD", "VA", "PA", "DE", "DC", "WV"],
  MA: ["MA", "CT", "RI", "NH", "NY", "VT"],
  MI: ["MI", "OH", "IN", "WI"],
  MN: ["MN", "WI", "IA", "SD", "ND"],
  MS: ["MS", "AL", "TN", "AR", "LA"],
  MO: ["MO", "IL", "KS", "AR", "TN", "KY", "IA", "OK"],
  MT: ["MT", "ID", "WY", "ND", "SD"],
  NE: ["NE", "KS", "IA", "SD", "WY", "CO"],
  NV: ["NV", "CA", "AZ", "UT", "OR", "ID"],
  NH: ["NH", "ME", "MA", "VT"],
  NJ: ["NJ", "NY", "PA", "CT", "DE"],
  NM: ["NM", "AZ", "CO", "TX", "OK"],
  NY: ["NY", "NJ", "CT", "PA", "MA", "VT"],
  NC: ["NC", "SC", "VA", "GA", "TN"],
  ND: ["ND", "MN", "SD", "MT"],
  OH: ["OH", "PA", "MI", "IN", "WV", "KY"],
  OK: ["OK", "TX", "KS", "AR", "MO", "CO", "NM"],
  OR: ["OR", "WA", "CA", "ID", "NV"],
  PA: ["PA", "NJ", "NY", "DE", "MD", "OH", "WV"],
  RI: ["RI", "MA", "CT"],
  SC: ["SC", "NC", "GA"],
  SD: ["SD", "ND", "MN", "IA", "NE", "WY", "MT"],
  TN: ["TN", "GA", "AL", "NC", "KY", "VA", "MS", "AR", "MO"],
  TX: ["TX", "LA", "OK", "AR", "NM"],
  UT: ["UT", "CO", "NV", "AZ", "ID", "WY"],
  VT: ["VT", "NH", "MA", "NY"],
  VA: ["VA", "MD", "NC", "WV", "DC", "KY", "TN"],
  WA: ["WA", "OR", "ID"],
  WV: ["WV", "VA", "OH", "PA", "MD", "KY"],
  WI: ["WI", "MN", "IA", "IL", "MI"],
  WY: ["WY", "MT", "SD", "NE", "CO", "UT", "ID"],
};

/**
 * Hard-filter vehicles that are clearly outside the user's range,
 * then score and sort the rest by relevance.
 */
export function scoreAndSort(
  vehicles: NormalizedVehicle[],
  prefs: UserPreferences
): ScoredVehicle[] {
  const targetYear = prefs.year ? Number(prefs.year) : null;
  const targetMileage = prefs.mileage ? Number(prefs.mileage) : null;
  const targetPrice = prefs.price ? Number(prefs.price) : null;
  const userState = prefs.state?.toUpperCase() ?? null;
  const nearbyStates = userState ? (NEARBY_STATES[userState] ?? [userState]) : [];

  // Cap auction bids at 60% of budget to leave room for repairs/fees/transport
  const maxAuctionBid = targetPrice ? targetPrice * 0.6 : null;

  // ── Hard filters ──
  const filtered = vehicles.filter((v) => {
    // Location: only keep vehicles from user's state or nearby
    if (userState && v.auctionLocation) {
      const stateMatch = v.auctionLocation.toUpperCase().match(/^([A-Z]{2})\s*-/);
      const carState = stateMatch?.[1];
      if (carState && !nearbyStates.includes(carState)) return false;
    }

    // Mileage: exclude over 1.5x target
    if (targetMileage && v.odometer > targetMileage * 1.5) return false;

    // Price: exclude if bid exceeds budget cap
    const price = v.currentBid ?? v.askingPrice ?? 0;
    if (maxAuctionBid && price > 0 && price > maxAuctionBid) return false;

    return true;
  });

  log("info", `Scoring: ${vehicles.length} → ${filtered.length} after hard filters`);

  // ── Soft scoring ──
  return filtered
    .map((v): ScoredVehicle => {
      let score = 0;

      // Year proximity (max 30)
      if (targetYear && v.year) {
        const yearDiff = Math.abs(v.year - targetYear);
        score += Math.max(0, 30 - yearDiff * 10);
      }

      // Mileage (max 25)
      if (targetMileage && v.odometer) {
        const ratio = v.odometer / targetMileage;
        if (ratio <= 0.7) score += 25;
        else if (ratio <= 1) score += 20;
        else if (ratio <= 1.25) score += 10;
        else score += 3;
      }

      // Price/value (max 25)
      const price = v.currentBid ?? v.askingPrice ?? 0;
      if (targetPrice && price > 0) {
        const repairEstimate = estimateRepairCost(v.primaryDamage);
        const totalEstimate = price + repairEstimate;
        const budgetRatio = totalEstimate / targetPrice;
        if (budgetRatio <= 0.4) score += 25;
        else if (budgetRatio <= 0.6) score += 20;
        else if (budgetRatio <= 0.8) score += 15;
        else if (budgetRatio <= 1.0) score += 8;
      }

      // Location proximity (max 15)
      if (userState && v.auctionLocation) {
        const stateMatch = v.auctionLocation.toUpperCase().match(/^([A-Z]{2})\s*-/);
        const carState = stateMatch?.[1];
        if (carState === userState) score += 15;
        else if (carState && nearbyStates.includes(carState)) score += 8;
      }

      // Title match (max 10)
      if (prefs.titleStatus && v.titleType) {
        const prefTitle = prefs.titleStatus.toLowerCase();
        const carTitle = v.titleType.toLowerCase();
        if (prefTitle === "clean" && carTitle === "clean") score += 10;
        if (prefTitle === "rebuilt" && (carTitle === "rebuilt" || carTitle === "salvage")) score += 10;
      }

      // Has keys bonus (5)
      if (v.hasKeys === true) score += 5;

      // Has image bonus (5)
      if (v.thumbnailUrl && !v.thumbnailUrl.includes("placeholder")) score += 5;

      return { ...v, matchScore: score };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}
