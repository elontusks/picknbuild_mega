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

    // Validate required fields
    if (!body.make?.trim() || !body.model?.trim() || !body.year?.trim() || !body.price?.trim()) {
      return Response.json(
        { error: "All fields (Make, Model, Year, Price) are required" },
        { status: 400 }
      );
    }

    // Validate year format
    if (!/^\d{4}$/.test(body.year.trim())) {
      return Response.json(
        { error: "Year must be a 4-digit number" },
        { status: 400 }
      );
    }

    const yearNum = parseInt(body.year.trim(), 10);
    const currentYear = new Date().getFullYear();
    if (yearNum < 1900 || yearNum > currentYear + 1) {
      return Response.json(
        { error: `Year must be between 1900 and ${currentYear + 1}` },
        { status: 400 }
      );
    }

    // Validate price format
    if (!/^\d+(\.\d{1,2})?$/.test(body.price.trim())) {
      return Response.json(
        { error: "Price must be a valid number" },
        { status: 400 }
      );
    }

    const priceNum = parseFloat(body.price.trim());
    if (priceNum <= 0) {
      return Response.json(
        { error: "Price must be greater than 0" },
        { status: 400 }
      );
    }

    if (priceNum > 999999999) {
      return Response.json(
        { error: "Price must be less than $999,999,999" },
        { status: 400 }
      );
    }

    // Validate field lengths
    if (body.make.trim().length < 2 || body.make.trim().length > 50) {
      return Response.json(
        { error: "Make must be between 2 and 50 characters" },
        { status: 400 }
      );
    }

    if (body.model.trim().length < 2 || body.model.trim().length > 50) {
      return Response.json(
        { error: "Model must be between 2 and 50 characters" },
        { status: 400 }
      );
    }

    const listing = await createSellerListing(user.id, body);
    return Response.json(listing, { status: 201 });
  } catch (error) {
    console.error("[api/seller/listings] POST error:", error);
    return Response.json(
      { error: "Failed to create listing. Please try again." },
      { status: 500 }
    );
  }
}
