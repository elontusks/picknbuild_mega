'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

type LayoutProps = {
  children: React.ReactNode;
};

export default function SellerLayout({ children }: LayoutProps) {
  const pathname = usePathname();

  const navLinks = [
    { href: '/seller', label: 'Dashboard' },
    { href: '/seller/listings', label: 'My Listings' },
    { href: '/seller/messages', label: 'Messages' },
    { href: '/seller/leads', label: 'Leads' },
    { href: '/seller/claim', label: 'Claim Dealership' },
  ];

  const isActive = (href: string) => {
    if (href === '/seller') return pathname === '/seller';
    return pathname.startsWith(href);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--background)', color: 'var(--foreground)', paddingTop: '80px' }}>
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar Navigation */}
        <aside style={{ width: '200px', borderRight: '1px solid var(--border)', padding: '24px 0', backgroundColor: 'var(--card)' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: '12px 16px',
                  textDecoration: 'none',
                  color: isActive(link.href) ? 'var(--accent)' : 'var(--foreground)',
                  fontSize: '14px',
                  fontWeight: isActive(link.href) ? '600' : '500',
                  borderLeft: isActive(link.href) ? '3px solid var(--accent)' : '3px solid transparent',
                  display: 'block',
                  transition: 'all 200ms',
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, padding: '24px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
