import "server-only";
import { createClient } from "@/lib/supabase/server";
import { mapProfileToUser, type ProfileForUser } from "@/lib/auth/map-user";
import type { User } from "@/contracts";

const PROFILE_COLUMNS =
  "id, roles, phone, email, display_name, full_name, zip, budget, credit_score, no_credit, preferences, created_at, onboarded_at" as const;

/**
 * Server-only: load the public-facing User record for any userId. Used by the
 * profile surfaces (buyer / dealer / seller) that need to render someone
 * else's identity. Returns null when the profile row is missing or has not
 * finished onboarding.
 */
export async function loadUserById(userId: string): Promise<User | null> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return null;
  return mapProfileToUser(profile as ProfileForUser, {
    id: profile.id,
    phone: profile.phone,
    email: profile.email,
  });
}
