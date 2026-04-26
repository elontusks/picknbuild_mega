'use client';

import Link from 'next/link';

export default function SellerDashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0', color: 'var(--foreground)' }}>Welcome to Your Seller Portal</h1>
        <p style={{ fontSize: '16px', color: 'var(--muted-foreground)', margin: 0 }}>Manage your car listings, messages, and leads all in one place.</p>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div style={{ padding: '20px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontWeight: '600', textTransform: 'uppercase' }}>Active Listings</div>
          <div style={{ fontSize: '28px', fontWeight: '700', marginTop: '8px', color: 'var(--foreground)' }}>0</div>
          <Link href="/seller/listings" style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none', marginTop: '8px', display: 'block' }}>View Listings →</Link>
        </div>
        <div style={{ padding: '20px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontWeight: '600', textTransform: 'uppercase' }}>Messages</div>
          <div style={{ fontSize: '28px', fontWeight: '700', marginTop: '8px', color: 'var(--foreground)' }}>0</div>
          <Link href="/seller/messages" style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none', marginTop: '8px', display: 'block' }}>View Messages →</Link>
        </div>
        <div style={{ padding: '20px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontWeight: '600', textTransform: 'uppercase' }}>Unlocked Leads</div>
          <div style={{ fontSize: '28px', fontWeight: '700', marginTop: '8px', color: 'var(--foreground)' }}>0</div>
          <Link href="/seller/leads" style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none', marginTop: '8px', display: 'block' }}>Manage Leads →</Link>
        </div>
        <div style={{ padding: '20px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontWeight: '600', textTransform: 'uppercase' }}>Free Listings</div>
          <div style={{ fontSize: '28px', fontWeight: '700', marginTop: '8px', color: 'var(--foreground)' }}>1</div>
          <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '8px' }}>Remaining</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Link href="/seller/listings" style={{ padding: '20px', borderRadius: '8px', backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)', textDecoration: 'none', fontWeight: '600', textAlign: 'center', cursor: 'pointer' }}>+ Create New Listing</Link>
        <Link href="/seller/claim" style={{ padding: '20px', borderRadius: '8px', border: '2px solid var(--accent)', color: 'var(--accent)', backgroundColor: 'transparent', textDecoration: 'none', fontWeight: '600', textAlign: 'center', cursor: 'pointer' }}>Claim Your Dealership</Link>
      </div>
    </div>
  );
}
