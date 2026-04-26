import { requireUser } from "@/services/team-01-auth";
import {
  deleteSellerListing,
  listSellerListings,
  updateSellerListing,
  type CreateSellerListingInput,
} from "@/services/team-02-profiles";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const listings = await listSellerListings(user.id);
    const listing = listings.find((l) => l.id === id);

    if (!listing) {
      return Response.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    const body: CreateSellerListingInput = await request.json();

    const updated = await updateSellerListing(id, body);
    return Response.json(updated);
  } catch (error) {
    console.error("[api/seller/listings/[id]] PUT error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to update listing" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const listings = await listSellerListings(user.id);
    const listing = listings.find((l) => l.id === id);

    if (!listing) {
      return Response.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    await deleteSellerListing(id);
    return Response.json({ success: true });
  } catch (error) {
    console.error("[api/seller/listings/[id]] DELETE error:", error);
    return Response.json(
      { error: "Failed to delete listing" },
      { status: 500 }
    );
  }
}
