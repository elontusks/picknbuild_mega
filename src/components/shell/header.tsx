import Link from "next/link";
import type { ReactNode } from "react";
import type { User } from "@/contracts";

type HeaderProps = {
  user: User | null;
  bellSlot: ReactNode;
  inboxSlot: ReactNode;
};

const NAV_LINKS = [
  { href: "/browse", label: "Browse" },
  { href: "/garage", label: "Garage" },
  { href: "/feed", label: "Feed" },
] as const;

export function Header({ user, bellSlot, inboxSlot }: HeaderProps) {
  return (
    <header
      data-shell-slot="header"
      className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-2 backdrop-blur-800/95"
    >
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-foreground"
        >
          picknbuild
        </Link>
        <nav aria-label="Primary desktop" className="hidden md:flex items-center gap-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground dark:hover:text-primary-foreground"
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
              className="ml-1 inline-flex h-9 items-center justify-center rounded-full bg-muted px-3 text-xs font-medium text-muted-foreground hover:bg-muted-800 dark:hover:bg-zinc-700"
            >
              {user.displayName ?? user.phone}
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="inline-flex h-9 items-center rounded-full px-3 text-sm font-medium text-muted-foreground hover:bg-muted dark:hover:bg-muted"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center rounded-full bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-muted dark:hover:bg-muted"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
