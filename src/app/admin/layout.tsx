import { requireAdmin } from "@/lib/admin/auth";
import { AdminNav } from "@/components/admin/admin-nav";

// ARCHITECTURE §2 live-update: admin views should reflect mutations without
// a manual reload, so every admin route is force-dynamic. We declare it once
// at the layout so no child page can forget.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <main
      data-testid="admin-layout"
      className="mx-auto flex max-w-6xl flex-col gap-4 p-6"
    >
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin</h1>
      </header>
      <AdminNav />
      {children}
    </main>
  );
}
