"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/browse", label: "Browse", icon: "🔍" },
  { href: "/garage", label: "Garage", icon: "🅿️" },
  { href: "/feed", label: "Feed", icon: "📰" },
  { href: "/inbox", label: "Inbox", icon: "✉️" },
  { href: "/profile", label: "Profile", icon: "👤" },
] as const;

function isActive(currentPath: string | null, href: string): boolean {
  if (!currentPath) return false;
  if (href === "/") return currentPath === "/";
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

/**
 * Hamburger menu for mobile navigation on viewports below the `md` breakpoint.
 * Displays a hamburger icon that toggles a dropdown menu. Hidden on `md+` via
 * Tailwind utility classes; the desktop header carries the equivalent navigation.
 */
export function MobileNavBar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Hamburger Menu Button - Fixed to header area */}
      <button
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 right-4 z-40 p-2 text-foreground hover:bg-muted rounded-lg transition-colors"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Overlay backdrop */}
          <div
            className="md:hidden fixed inset-0 z-30 bg-black/20"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Menu */}
          <nav
            aria-label="Primary"
            data-shell-slot="mobile-nav"
            className="md:hidden fixed top-16 right-4 z-30 min-w-48 bg-background border border-border rounded-lg shadow-lg overflow-hidden"
          >
            {TABS.map((tab) => {
              const active = isActive(pathname, tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => setIsOpen(false)}
                  aria-current={active ? "page" : undefined}
                  data-active={active}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 transition-colors ${
                    active
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <span aria-hidden="true" className="text-lg">
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </nav>
        </>
      )}
    </>
  );
}
