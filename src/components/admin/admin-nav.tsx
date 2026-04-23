import Link from "next/link";

const TABS: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/deals", label: "Deals" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/subscriptions", label: "Subscriptions" },
  { href: "/admin/monitoring", label: "Monitoring" },
  { href: "/admin/sponsors", label: "Sponsors" },
];

export function AdminNav() {
  return (
    <nav
      data-testid="admin-nav"
      className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3 text-sm dark:border-zinc-800"
    >
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className="rounded-md border border-zinc-200 bg-white px-3 py-1 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
