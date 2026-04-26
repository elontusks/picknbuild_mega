'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClaimDealershipPage() {
  const router = useRouter();
  const [dealershipName, setDealershipName] = useState('');
  const [location, setLocation] = useState('');
  const [claimed, setClaimed] = useState(false);

  const handleClaimDealership = () => {
    setClaimed(true);
    setTimeout(() => {
      router.push('/seller');
    }, 2000);
  };

  if (claimed) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', textAlign: 'center', paddingTop: '60px' }}>
        <div style={{ fontSize: '48px' }}>✓</div>
        <h2 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: 'var(--foreground)' }}>Dealership Claimed!</h2>
        <p style={{ fontSize: '16px', color: 'var(--muted-foreground)', margin: 0 }}>Your dealership account is now active. Redirecting to dashboard...</p>
      </div>
    );
  }

  const isFormValid = dealershipName.trim() && location.trim();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0', color: 'var(--foreground)' }}>Claim Your Dealership</h1>
        <p style={{ fontSize: '16px', color: 'var(--muted-foreground)', margin: 0 }}>Upgrade to a professional dealer account with 10 free listings and lead management</p>
      </div>

      {/* Claim Form */}
      <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ padding: '24px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--foreground)' }}>Dealership Name</label>
              <input
                type="text"
                placeholder="e.g., John's Auto Sales"
                value={dealershipName}
                onChange={(e) => setDealershipName(e.target.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--foreground)' }}>Location</label>
              <input
                type="text"
                placeholder="City, State"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <button
              onClick={handleClaimDealership}
              disabled={!isFormValid}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                backgroundColor: isFormValid ? 'var(--accent)' : 'var(--muted)',
                color: isFormValid ? 'var(--accent-foreground)' : 'var(--foreground)',
                border: 'none',
                fontWeight: '600',
                cursor: isFormValid ? 'pointer' : 'not-allowed',
                marginTop: '12px',
                opacity: isFormValid ? 1 : 0.5,
              }}
            >
              Claim Dealership
            </button>
          </div>
        </div>

        {/* Benefits */}
        <div style={{ padding: '24px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}>
          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--foreground)' }}>Dealer Account Benefits</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '18px' }}>✓</div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--foreground)' }}>10 Free Listings</div>
                <div style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>Post up to 10 vehicles for free each month</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '18px' }}>✓</div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--foreground)' }}>Lead Management</div>
                <div style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>Unlock buyer leads for $15 each to contact interested buyers</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '18px' }}>✓</div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--foreground)' }}>Dealership Profile</div>
                <div style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>Verified dealership badge and profile page</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
