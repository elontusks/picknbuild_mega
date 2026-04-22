import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

// Team 15 — secure storage layer + sponsor catalog.
//
// Generic typed key-value persistence fronted by Supabase. Every consuming
// team (comments, saved vehicles, agreements, messages, payments,
// attachments, feed) writes through the same (bucket, id) shape. Each row
// is a jsonb blob; the caller owns the interpretation.
//
// Runs server-side with the service-role client, which bypasses RLS.
// Both tables below have non-service-role access denied at the database
// (using (false)) so the service is the single supported entry point.
// Per-user authorization is enforced above this layer (src/lib/authz).
// Signatures are intentionally identical to the original stub so that
// downstream teams can switch to the real implementation without a diff.

export const putRecord = async <T>(
  bucket: string,
  id: string,
  value: T,
): Promise<void> => {
  const supabase = createAdminClient();
  const { error } = await supabase.from("secure_records").upsert(
    {
      bucket,
      id,
      value: value as never,
    },
    { onConflict: "bucket,id" },
  );
  if (error) {
    throw new Error(
      `[team-15-storage] putRecord(${bucket}/${id}) failed: ${error.message}`,
    );
  }
};

export const getRecord = async <T>(
  bucket: string,
  id: string,
): Promise<T | null> => {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("secure_records")
    .select("value")
    .eq("bucket", bucket)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new Error(
      `[team-15-storage] getRecord(${bucket}/${id}) failed: ${error.message}`,
    );
  }
  return (data?.value ?? null) as T | null;
};

export const listRecords = async <T>(bucket: string): Promise<T[]> => {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("secure_records")
    .select("value")
    .eq("bucket", bucket)
    .order("updated_at", { ascending: false });
  if (error) {
    throw new Error(
      `[team-15-storage] listRecords(${bucket}) failed: ${error.message}`,
    );
  }
  return (data ?? []).map((row) => row.value as T);
};

export const removeRecord = async (
  bucket: string,
  id: string,
): Promise<void> => {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("secure_records")
    .delete()
    .eq("bucket", bucket)
    .eq("id", id);
  if (error) {
    throw new Error(
      `[team-15-storage] removeRecord(${bucket}/${id}) failed: ${error.message}`,
    );
  }
};

export type SponsorBlock = {
  id: string;
  path: "dealer" | "auction" | "picknbuild" | "private";
  title: string;
  bodyHtml: string;
  cta?: { label: string; href: string };
};

export const getSponsorsForPath = async (
  path: SponsorBlock["path"],
): Promise<SponsorBlock[]> => {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sponsor_blocks")
    .select("id, path, title, body_html, cta_label, cta_href")
    .eq("path", path)
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) {
    throw new Error(
      `[team-15-storage] getSponsorsForPath(${path}) failed: ${error.message}`,
    );
  }
  return (data ?? []).map((row) => {
    const block: SponsorBlock = {
      id: row.id,
      path: row.path as SponsorBlock["path"],
      title: row.title,
      bodyHtml: row.body_html,
    };
    if (row.cta_label && row.cta_href) {
      block.cta = { label: row.cta_label, href: row.cta_href };
    }
    return block;
  });
};
