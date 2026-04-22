import { NextResponse, type NextRequest } from "next/server";
import { requireCap } from "@/lib/authz/server/require-cap";
import { CAPABILITIES as C } from "@/lib/authz/capabilities";
import {
  listListings,
  upsertDealerListing,
  uploadUserListing,
} from "@/services/team-03-supply";
import type { ListingSource, ListingStatus, TitleStatus } from "@/contracts";

const coerceNumber = (v: string | null): number | undefined => {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

export const GET = requireCap(C.listings.view)(async (req: NextRequest) => {
  const url = req.nextUrl;
  const source = url.searchParams.get("source") as ListingSource | null;
  const sourcesCsv = url.searchParams.get("sources");
  const ownerUserId = url.searchParams.get("ownerUserId") ?? undefined;
  const make = url.searchParams.get("make") ?? undefined;
  const model = url.searchParams.get("model") ?? undefined;
  const yearMin = coerceNumber(url.searchParams.get("yearMin"));
  const yearMax = coerceNumber(url.searchParams.get("yearMax"));
  const mileageMax = coerceNumber(url.searchParams.get("mileageMax"));
  const titlePreference = url.searchParams.get("titlePreference") as
    | "clean"
    | "rebuilt"
    | "both"
    | null;
  const status = url.searchParams.get("status") as ListingStatus | "any" | null;
  const locationZip = url.searchParams.get("zip") ?? undefined;
  const vin = url.searchParams.get("vin") ?? undefined;
  const limit = coerceNumber(url.searchParams.get("limit"));
  const offset = coerceNumber(url.searchParams.get("offset"));

  const listings = await listListings({
    source: source ?? undefined,
    sources: sourcesCsv ? (sourcesCsv.split(",").filter(Boolean) as ListingSource[]) : undefined,
    ownerUserId,
    make,
    model,
    yearRange: yearMin !== undefined && yearMax !== undefined ? [yearMin, yearMax] : undefined,
    mileageMax,
    titlePreference: titlePreference ?? undefined,
    status: status ?? undefined,
    locationZip,
    vin,
    limit,
    offset,
  });
  return NextResponse.json({ listings });
});

type CreateBody = {
  source?: "user" | "dealer";
  year?: number | string;
  make?: string;
  model?: string;
  trim?: string;
  mileage?: number | string;
  price?: number | string;
  vin?: string;
  titleStatus?: TitleStatus;
  locationZip?: string;
  photos?: string[];
  sourceUrl?: string;
};

export const POST = requireCap(C.listings.create)(async (req, _ctx, principal) => {
  const body = (await req.json().catch(() => null)) as CreateBody | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const source: "user" | "dealer" =
    body.source === "dealer" && principal.roles.includes("dealer") ? "dealer" : "user";

  const submit = source === "dealer" ? upsertDealerListing : uploadUserListing;
  const result = await submit({
    ownerUserId: principal.id,
    form: {
      year: body.year,
      make: body.make,
      model: body.model,
      trim: body.trim,
      mileage: body.mileage,
      price: body.price,
      vin: body.vin,
      titleStatus: body.titleStatus,
      locationZip: body.locationZip,
      photos: body.photos,
      sourceUrl: body.sourceUrl,
    },
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.reason, field: result.field }, { status: 400 });
  }
  return NextResponse.json({ listing: result.listing }, { status: 201 });
});
