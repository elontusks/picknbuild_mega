import { NextResponse, type NextRequest } from "next/server";
import {
  decodeVin,
  estimateTradeInFromDecode,
} from "@/lib/search-demo/vin-lookup";
import type { TitleType } from "@/lib/search-demo/types";

const VIN_LENGTH = 17;
const DEFAULT_MILEAGE = 60_000;

/**
 * GET /api/vin?vin=...&mileage=...&titleType=clean|rebuilt
 *
 * Wraps the free NHTSA vPIC decoder + a depreciation-curve trade-in estimate.
 * Lives server-side so we can dodge CORS, rate-limit, and add caching later.
 * Returns { decoded, estimatedValue }. Decoded is null when NHTSA can't ID the
 * VIN — clients should treat that as "couldn't decode that VIN" inline.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const vin = (searchParams.get("vin") ?? "").trim().toUpperCase();
  if (vin.length !== VIN_LENGTH) {
    return NextResponse.json(
      { error: "vin must be exactly 17 characters" },
      { status: 400 },
    );
  }

  const mileageParam = searchParams.get("mileage");
  const mileage =
    mileageParam !== null && mileageParam !== ""
      ? Number.parseInt(mileageParam, 10)
      : DEFAULT_MILEAGE;
  const safeMileage =
    Number.isFinite(mileage) && mileage >= 0 ? mileage : DEFAULT_MILEAGE;

  const titleParam = searchParams.get("titleType");
  const titleType: TitleType = titleParam === "rebuilt" ? "rebuilt" : "clean";

  const decoded = await decodeVin(vin);
  if (!decoded) {
    return NextResponse.json({ decoded: null, estimatedValue: 0 });
  }

  const estimatedValue = estimateTradeInFromDecode(
    decoded,
    safeMileage,
    titleType,
  );
  return NextResponse.json({ decoded, estimatedValue });
}
