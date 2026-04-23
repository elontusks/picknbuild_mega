import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  deriveRole,
  mapProfileToUser,
  type ProfileForUser,
} from "@/lib/auth/map-user";
import type { User, UserRole } from "@/contracts";

const PROFILE_COLUMNS =
  "id, roles, phone, email, display_name, full_name, zip, budget, credit_score, no_credit, preferences, created_at, onboarded_at" as const;

export type AdminUserFilter = {
  role?: UserRole;
};

// Reads profiles directly with the service-role client — the public auth
// service only exposes the *current* viewer. Admin listing has to see every
// profile, which is a policy decision gated by requireAdmin() one layer up.
// Rows without a zip have not onboarded; we still surface them (as "pending")
// so an operator can see them.
export type AdminUserRow = {
  id: string;
  role: UserRole;
  email: string | null;
  displayName: string | null;
  zip: string | null;
  phone: string | null;
  onboarded: boolean;
  createdAt: string;
  budget: number | null;
  creditScore: number | null;
  noCredit: boolean;
};

export async function listAllUsers(
  filter: AdminUserFilter = {},
): Promise<AdminUserRow[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listAllUsers: ${error.message}`);

  const rows: AdminUserRow[] = (data ?? []).map((row) => {
    return {
      id: row.id,
      role: deriveRole(row.roles),
      email: row.email ?? null,
      displayName: row.display_name ?? row.full_name ?? null,
      zip: row.zip ?? null,
      phone: row.phone ?? null,
      onboarded: Boolean(row.zip),
      createdAt: row.created_at,
      budget: row.budget ?? null,
      creditScore: row.credit_score ?? null,
      noCredit: Boolean(row.no_credit),
    };
  });

  return filter.role ? rows.filter((r) => r.role === filter.role) : rows;
}

export async function getUserForAdmin(id: string): Promise<User | null> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getUserForAdmin: ${error.message}`);
  if (!data) return null;
  return mapProfileToUser(data as ProfileForUser, {
    id: data.id,
    phone: data.phone,
    email: data.email,
  });
}
