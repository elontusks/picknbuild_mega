"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/search", label: "Search", icon: "🔍" },
  { href: "/garage", label: "Garage", icon: "🅿️" },
  { href: "/inbox", label: "Inbox", icon: "✉️" },
  { href: "/profile", label: "Profile", icon: "👤" },
] as const;

function isActive(currentPath: string | null, href: string): boolean {
  if (!currentPath) return false;
  if (href === "/") return currentPath === "/";
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

/**
 * Bottom-anchored tab bar used on viewports below the `md` breakpoint.
 * Hidden on `md+` via Tailwind utility classes; the desktop header carries
 * the equivalent navigation.
 */
export function MobileNavBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      data-shell-slot="mobile-nav"
      className="md:hidden sticky bottom-0 left-0 right-0 z-30 flex items-stretch border-t border-border bg-background/95 backdrop-blur-800/95"
    >
      {TABS.map((tab) => {
        const active = isActive(pathname, tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            data-active={active}
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium ${
              active
                ? "text-foreground"
                : "text-muted-foreground"
            }`}
          >
            <span aria-hidden="true" className="text-base">
              {tab.icon}
            </span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
