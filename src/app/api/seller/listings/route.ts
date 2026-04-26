import { requireUser } from "@/services/team-01-auth";
import {
  listSellerListings,
  createSellerListing,
  type CreateSellerListingInput,
} from "@/services/team-02-profiles";

export async function GET() {
  try {
    const user = await requireUser();
    const listings = await listSellerListings(user.id);
    return Response.json(listings);
  } catch (error) {
    console.error("[api/seller/listings] GET error:", error);
    return Response.json(
      { error: "Failed to load listings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body: CreateSellerListingInput = await request.json();

    if (!body.make?.trim() || !body.model?.trim() || !body.year?.trim() || !body.price?.trim()) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const listing = await createSellerListing(user.id, body);
    return Response.json(listing, { status: 201 });
  } catch (error) {
    console.error("[api/seller/listings] POST error:", error);
    return Response.json(
      { error: "Failed to create listing" },
      { status: 500 }
    );
  }
}
