import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface DenialRecord {
  principal_id: string | null;
  capability: string;
  resource_type: string | null;
  resource_id: string | null;
  reason: string;
  request_path: string | null;
}

export async function auditDenial(record: DenialRecord): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("authz_denials").insert(record);
    if (error) console.error("[authz] denial insert failed:", error.message);
  } catch (err) {
    console.error("[authz] denial write threw:", err);
  }
}
