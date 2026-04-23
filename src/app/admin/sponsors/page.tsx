import { createAdminClient } from "@/lib/supabase/admin";
import { SponsorCreateForm } from "@/components/admin/sponsor-create-form";
import { SponsorToggleButton } from "@/components/admin/sponsor-toggle-button";

type SponsorRow = {
  id: string;
  path: "dealer" | "auction" | "picknbuild" | "private";
  title: string;
  body_html: string;
  cta_label: string | null;
  cta_href: string | null;
  active: boolean;
  sort_order: number;
};

async function loadSponsors(): Promise<SponsorRow[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("sponsor_blocks")
    .select("id, path, title, body_html, cta_label, cta_href, active, sort_order")
    .order("path", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) throw new Error(`loadSponsors: ${error.message}`);
  return (data ?? []) as SponsorRow[];
}

export default async function AdminSponsorsPage() {
  const sponsors = await loadSponsors();

  return (
    <section data-testid="admin-sponsors" className="flex flex-col gap-4">
      <section>
        <h3 className="pb-2 text-sm font-semibold">Create sponsor</h3>
        <SponsorCreateForm />
      </section>

      <section>
        <h3 className="pb-2 text-sm font-semibold">Catalog</h3>
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-zinc-500">
            <tr>
              <th className="pb-2">Path</th>
              <th className="pb-2">Title</th>
              <th className="pb-2">CTA</th>
              <th className="pb-2">Active</th>
              <th className="pb-2">Order</th>
              <th className="pb-2">—</th>
            </tr>
          </thead>
          <tbody>
            {sponsors.map((s) => (
              <tr
                key={s.id}
                className="border-t border-zinc-100 text-xs dark:border-zinc-900"
              >
                <td className="py-2">{s.path}</td>
                <td className="py-2">{s.title}</td>
                <td className="py-2">{s.cta_label ?? "—"}</td>
                <td className="py-2">{s.active ? "yes" : "no"}</td>
                <td className="py-2">{s.sort_order}</td>
                <td className="py-2">
                  <SponsorToggleButton id={s.id} active={s.active} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sponsors.length === 0 ? (
          <p className="text-xs text-zinc-500">No sponsors yet.</p>
        ) : null}
      </section>
    </section>
  );
}
