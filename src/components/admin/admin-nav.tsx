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
      className="flex flex-wrap gap-2 border-b border-border pb-3 text-sm-800"
    >
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className="rounded-md border border-border bg-background px-3 py-1 text-muted-foreground hover:bg-background-800-950 dark:hover:bg-muted"
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
