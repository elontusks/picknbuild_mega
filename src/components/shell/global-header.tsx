'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import type { User } from '@/contracts';

type GlobalHeaderProps = {
  user: User | null;
  bellSlot: ReactNode;
  inboxSlot: ReactNode;
};

const NAV_LINKS = [
  { href: '/search', label: 'Search' },
  { href: '/garage', label: 'Garage' },
  { href: '/feed', label: 'Feed' },
  { href: '/inbox', label: 'Inbox' },
] as const;

export function GlobalHeader({ user, bellSlot, inboxSlot }: GlobalHeaderProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/search') return pathname.startsWith('/search') || pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        {/* Logo Section */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="flex items-center no-underline"
          >
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/picknbuild%20banner-Recovered-min-iq954CW7VTLzjYxMAqY9Xw91r73j86.png"
              alt="picknbuild"
              style={{ height: '32px', width: 'auto' }}
            />
          </Link>

          {/* Status Indicator Circles */}
          <div className="flex gap-1.5 items-center">
            <div className="w-3 h-3 rounded-full bg-emerald-400" aria-label="green status" />
            <div className="w-3 h-3 rounded-full bg-amber-400" aria-label="yellow status" />
            <div className="w-3 h-3 rounded-full bg-red-400" aria-label="red status" />
          </div>

          {/* Tagline */}
          <div className="hidden md:block">
            <p className="text-xs text-muted-foreground m-0">
              Shop every way to buy a car — all at once.
            </p>
          </div>
        </div>

        {/* Nav Links (desktop) */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex gap-2"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded text-sm transition-all ${
                isActive(link.href)
                  ? 'text-accent font-medium'
                  : 'text-foreground font-normal hover:bg-muted'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Notification Bell and Inbox */}
          {user ? (
            <>
              {bellSlot}
              {inboxSlot}
            </>
          ) : null}

          {/* Auth / Profile */}
          {!user ? (
            <>
              <Link
                href="/login"
                className="px-4 py-2 rounded text-sm text-foreground hover:bg-muted transition-all"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 rounded text-sm font-medium text-accent-foreground bg-accent hover:opacity-90 transition-all"
              >
                Sign up
              </Link>
            </>
          ) : (
            <Link
              href="/profile"
              className="px-3 py-1.5 rounded-full text-xs font-medium text-foreground bg-muted hover:bg-accent hover:text-accent-foreground transition-all"
            >
              {user.displayName ?? user.phone}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
