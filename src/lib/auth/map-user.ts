import type { Tables } from "@/lib/supabase/database.types";
import type { BestFitPreference, User, UserRole } from "@/contracts";

type ProfileRow = Tables<"profiles">;

type AuthUserSlice = {
  id: string;
  phone?: string | null;
  email?: string | null;
};

const VALID_BEST_FIT: ReadonlyArray<BestFitPreference> = ["lowestTotal", "lowestMonthly"];

export function deriveRole(roles: readonly string[] | null | undefined): UserRole {
  const set = new Set(roles ?? []);
  if (set.has("admin")) return "admin";
  if (set.has("dealer")) return "dealer";
  if (set.has("individual_seller") || set.has("seller")) return "seller";
  return "buyer";
}

function readPreferences(raw: unknown): User["preferences"] {
  const fallback: User["preferences"] = {
    bestFit: "lowestTotal",
    notifChannels: ["in-app"],
  };
  if (!raw || typeof raw !== "object") return fallback;
  const obj = raw as Record<string, unknown>;
  const bestFitRaw = obj["bestFit"];
  const bestFit: BestFitPreference =
    typeof bestFitRaw === "string" && (VALID_BEST_FIT as readonly string[]).includes(bestFitRaw)
      ? (bestFitRaw as BestFitPreference)
      : fallback.bestFit;
  const channelsRaw = obj["notifChannels"];
  const notifChannels = Array.isArray(channelsRaw)
    ? channelsRaw.filter((c): c is string => typeof c === "string")
    : fallback.notifChannels;
  return { bestFit, notifChannels };
}

export type ProfileForUser = Pick<
  ProfileRow,
  | "id"
  | "roles"
  | "phone"
  | "email"
  | "display_name"
  | "full_name"
  | "zip"
  | "budget"
  | "credit_score"
  | "no_credit"
  | "preferences"
  | "created_at"
  | "onboarded_at"
>;

/**
 * Pure mapping from a profile row + auth user slice to the public §3.7 User
 * contract. Returns null when the profile has not completed onboarding (no
 * zip captured) — consumers must redirect such users to /onboarding.
 */
export function mapProfileToUser(
  profile: ProfileForUser,
  auth: AuthUserSlice,
): User | null {
  if (!profile.zip) return null;
  const phone = profile.phone ?? auth.phone ?? "";
  if (!phone) return null;

  const user: User = {
    id: profile.id,
    role: deriveRole(profile.roles),
    phone,
    zip: profile.zip,
    preferences: readPreferences(profile.preferences),
    createdAt: profile.created_at,
  };
  const email = profile.email ?? auth.email ?? undefined;
  if (email) user.email = email;
  const displayName = profile.display_name ?? profile.full_name ?? undefined;
  if (displayName) user.displayName = displayName;
  if (profile.budget != null) user.budget = profile.budget;
  if (profile.credit_score != null) user.creditScore = profile.credit_score;
  if (profile.no_credit) user.noCredit = true;
  return user;
}
