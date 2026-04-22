import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
  AccountStatus,
  Principal,
  UserRole,
} from "@/lib/authz/types";

const VALID_ROLES = new Set<string>([
  "buyer",
  "dealer",
  "individual_seller",
  "admin",
]);
const VALID_STATUSES = new Set<string>([
  "active",
  "suspended",
  "banned",
  "unverified",
]);

function toUserRole(s: string): s is UserRole {
  return VALID_ROLES.has(s);
}

function toAccountStatus(s: string): AccountStatus {
  return VALID_STATUSES.has(s) ? (s as AccountStatus) : "active";
}

/**
 * Load the current request's Principal. Returns null if anonymous.
 * Cached per-request via React's `cache()`.
 */
export const loadPrincipal = cache(async (): Promise<Principal | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `id, roles, account_status, phone_verified_at,
       dealer_pages ( id, claimed, subscription_active )`,
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  const roles: UserRole[] = (profile.roles ?? []).filter(toUserRole);
  const effectiveRoles: UserRole[] = roles.length > 0 ? roles : ["buyer"];

  // PostgREST returns foreign-table joins as an array even for 1:1 relations.
  const dealerRow = Array.isArray(profile.dealer_pages)
    ? profile.dealer_pages[0]
    : profile.dealer_pages;

  return {
    id: user.id,
    roles: effectiveRoles,
    email_verified: !!user.email_confirmed_at,
    phone_verified: !!profile.phone_verified_at,
    account_status: toAccountStatus(profile.account_status),
    dealer: dealerRow
      ? {
          page_id: dealerRow.id,
          page_claimed: dealerRow.claimed,
          subscription_active: dealerRow.subscription_active,
        }
      : undefined,
  };
});
