import "server-only";
import { createClient } from "@/lib/supabase/server";

export type SellerListing = {
  id: string;
  seller_id: string;
  make: string;
  model: string;
  year: string;
  price: string;
  description: string | null;
  status: string;
  views: number;
  created_at: string;
  updated_at: string;
};

export type CreateSellerListingInput = {
  make: string;
  model: string;
  year: string;
  price: string;
  description?: string;
};

// --- Seller Listings -------------------------------------------------------

export const listSellerListings = async (sellerId: string): Promise<SellerListing[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("seller_listings")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[team-02] Failed to list seller listings:", error);
    throw new Error(`Failed to list seller listings: ${error.message}`);
  }

  return data || [];
};

export const createSellerListing = async (
  sellerId: string,
  input: CreateSellerListingInput
): Promise<SellerListing> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("seller_listings")
    .insert([
      {
        seller_id: sellerId,
        make: input.make,
        model: input.model,
        year: input.year,
        price: input.price,
        description: input.description || null,
        status: "active",
        views: 0,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("[team-02] Failed to create seller listing:", error);
    throw new Error(`Failed to create seller listing: ${error.message}`);
  }

  return data;
};

export const deleteSellerListing = async (listingId: string): Promise<void> => {
  const supabase = await createClient();
  const { error } = await supabase
    .from("seller_listings")
    .delete()
    .eq("id", listingId);

  if (error) {
    console.error("[team-02] Failed to delete seller listing:", error);
    throw new Error(`Failed to delete seller listing: ${error.message}`);
  }
};

export const updateSellerListing = async (
  listingId: string,
  updates: Partial<CreateSellerListingInput>
): Promise<SellerListing> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("seller_listings")
    .update(updates)
    .eq("id", listingId)
    .select()
    .single();

  if (error) {
    console.error("[team-02] Failed to update seller listing:", error);
    throw new Error(`Failed to update seller listing: ${error.message}`);
  }

  return data;
};
