import { requireUser } from "@/services/team-01-auth";
import { SearchPageClient } from "./search-page-client";

export const dynamic = "force-dynamic";

/**
 * Search surface shell. RSC requires the user (Team 1's requireAuth gate),
 * hands it to the client tree so every intake store subscriber has a real
 * User.id to persist under.
 */
export default async function SearchPage() {
  const user = await requireUser();
  return <SearchPageClient user={user} />;
}
