import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireCap } from "@/lib/authz/server/require-cap";
import { CAPABILITIES as C } from "@/lib/authz/capabilities";

// Untyped client: the new scraper tables won't appear in database.types.ts
// until the migration runs and `npm run db:types` regenerates them.
function rawAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export const GET = requireCap(C.listings.view)(async () => {
  const supabase = rawAdminClient();
  const { data, error } = await supabase
    .from("scrape_sites")
    .select("id, name, base_url, site_type, active, search_url_template, updated_at")
    .order("name", { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ sites: data ?? [] });
});

interface CreateSiteBody {
  name?: string;
  baseUrl?: string;
  siteType?: "auction" | "dealer" | "marketplace";
  searchUrlTemplate?: string;
  active?: boolean;
}

export const POST = requireCap(C.listings.create)(async (req: NextRequest) => {
  const body = (await req.json().catch(() => null)) as CreateSiteBody | null;
  if (!body?.name || !body?.baseUrl) {
    return NextResponse.json(
      { error: "name and baseUrl are required" },
      { status: 400 }
    );
  }
  const supabase = rawAdminClient();
  const { data, error } = await supabase
    .from("scrape_sites")
    .upsert(
      {
        name: body.name,
        base_url: body.baseUrl,
        site_type: body.siteType ?? "auction",
        active: body.active ?? true,
        search_url_template: body.searchUrlTemplate ?? null,
      },
      { onConflict: "base_url" }
    )
    .select("*")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ site: data }, { status: 201 });
});
