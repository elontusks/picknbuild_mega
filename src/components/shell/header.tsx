import Link from "next/link";
import type { ReactNode } from "react";
import type { User } from "@/contracts";

type HeaderProps = {
  user: User | null;
  bellSlot: ReactNode;
  inboxSlot: ReactNode;
};

const NAV_LINKS = [
  { href: "/search", label: "Search" },
  { href: "/garage", label: "Garage" },
  { href: "/feed", label: "Feed" },
] as const;

export function Header({ user, bellSlot, inboxSlot }: HeaderProps) {
  return (
    <header
      data-shell-slot="header"
      className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-zinc-200 bg-white/95 px-4 py-2 backdrop-blur dark:border-zinc-800 dark:bg-black/95"
    >
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-white"
        >
          picknbuild
        </Link>
        <nav aria-label="Primary desktop" className="hidden md:flex items-center gap-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-1">
        {user ? (
          <>
            {bellSlot}
            {inboxSlot}
            <Link
              href="/profile"
              data-shell-slot="profile-link"
              className="ml-1 inline-flex h-9 items-center justify-center rounded-full bg-zinc-100 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
            >
              {user.displayName ?? user.phone}
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="inline-flex h-9 items-center rounded-full px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center rounded-full bg-zinc-950 px-3 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
