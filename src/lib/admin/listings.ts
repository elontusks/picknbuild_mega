import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

// Thin admin-only count over Team 3's listings table. We don't reach into
// team-03-supply's store — consumers call this when they want a number,
// not the rows. Count-only via `head: true` so we don't transfer data.
export async function countListings(): Promise<number> {
  const db = createAdminClient();
  const { count, error } = await db
    .from("listings")
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`countListings: ${error.message}`);
  return count ?? 0;
}
