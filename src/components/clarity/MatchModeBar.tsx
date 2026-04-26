'use client';

import { useState } from 'react';
import { UserProfile, CreditTier } from '@/lib/search-demo/types';
import { getCreditColor, getCreditLabel } from '@/lib/search-demo/matchModeUtils';

const CREDIT_SCORE_MIN = 300;
const CREDIT_SCORE_MAX = 850;

interface MatchModeBarProps {
  userProfile: UserProfile;
  userZip: string;
  onMatchModeChange: (enabled: boolean) => void;
  onUserProfileChange: (profile: UserProfile) => void;
}

const requiredMark = (
  <span aria-hidden="true" style={{ color: '#dc2626', marginLeft: '2px' }}>*</span>
);

export default function MatchModeBar({ userProfile, userZip, onMatchModeChange, onUserProfileChange }: MatchModeBarProps) {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [trim, setTrim] = useState('');

  const creditTier: CreditTier = userProfile.creditScore >= 700 ? 'green' : userProfile.creditScore >= 620 ? 'yellow' : 'red';

  return (
    <div style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--card)', padding: '16px 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
        {/* Location — auto-filled from user record, read-only */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--muted-foreground)' }}>Location (ZIP)</label>
          <input
            type="text"
            value={userZip}
            readOnly
            aria-readonly="true"
            title="Your saved ZIP. Update it from your profile."
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--foreground)', fontSize: '14px', cursor: 'not-allowed' }}
          />
        </div>

        {/* Make — required */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--muted-foreground)' }}>Make{requiredMark}</label>
          <input
            type="text"
            placeholder="e.g., Toyota"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            required
            aria-required="true"
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontSize: '14px' }}
          />
        </div>

        {/* Model — required */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--muted-foreground)' }}>Model{requiredMark}</label>
          <input
            type="text"
            placeholder="e.g., Camry"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            required
            aria-required="true"
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontSize: '14px' }}
          />
        </div>

        {/* Year — required */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--muted-foreground)' }}>Year{requiredMark}</label>
          <input
            type="number"
            placeholder="2020"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            min="1990"
            max={new Date().getFullYear()}
            required
            aria-required="true"
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontSize: '14px' }}
          />
        </div>

        {/* Mileage — required */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--muted-foreground)' }}>Mileage{requiredMark}</label>
          <select
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
            required
            aria-required="true"
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontSize: '14px' }}
          >
            <option value="">Select mileage</option>
            <option value="50k">Under 50k</option>
            <option value="100k">50k-100k</option>
            <option value="150k">100k-150k</option>
            <option value="150k+">150k+</option>
          </select>
        </div>

        {/* Trim — optional */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--muted-foreground)' }}>Trim</label>
          <input
            type="text"
            placeholder="e.g., LE"
            value={trim}
            onChange={(e) => setTrim(e.target.value)}
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontSize: '14px' }}
          />
        </div>

        {/* Available Cash (Budget) — required */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--muted-foreground)' }}>Available Cash Right Now{requiredMark}</label>
          <input
            type="number"
            value={userProfile.availableCash}
            onChange={(e) => onUserProfileChange({ ...userProfile, availableCash: parseInt(e.target.value) || 0 })}
            placeholder="$0"
            min={0}
            required
            aria-required="true"
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontSize: '14px' }}
          />
        </div>

        {/* Credit Score — dropdown with preset tiers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--muted-foreground)' }}>Credit Score</label>
          <select
            value={userProfile.hasNoCredit ? '' : userProfile.creditScore}
            disabled={userProfile.hasNoCredit}
            onChange={(e) => {
              if (e.target.value === '') {
                onUserProfileChange({ ...userProfile, creditScore: 550 });
                return;
              }
              onUserProfileChange({ ...userProfile, creditScore: parseInt(e.target.value, 10) });
            }}
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontSize: '14px', opacity: userProfile.hasNoCredit ? 0.5 : 1, cursor: userProfile.hasNoCredit ? 'not-allowed' : 'pointer' }}
          >
            <option value="">Select credit tier</option>
            <option value="550">Poor</option>
            <option value="620">Fair</option>
            <option value="670">Good</option>
            <option value="720">Very Good</option>
            <option value="760">Excellent</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--muted-foreground)', cursor: 'pointer', userSelect: 'none', marginTop: '2px' }}>
            <input
              type="checkbox"
              checked={!!userProfile.hasNoCredit}
              onChange={(e) => onUserProfileChange({ ...userProfile, hasNoCredit: e.target.checked })}
              style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: 'var(--accent)' }}
            />
            No credit
          </label>
        </div>

        {/* Credit Tier Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '6px',
          backgroundColor: creditTier === 'green' ? '#10b981' : creditTier === 'yellow' ? '#fbbf24' : '#f87171',
          color: creditTier === 'green' ? '#065f46' : creditTier === 'yellow' ? '#78350f' : '#7f1d1d',
          fontSize: '13px',
          fontWeight: '500'
        }}>
          Your Risk Tier: {getCreditLabel(creditTier)}
        </div>

        {/* Title Type Toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--muted-foreground)' }}>Title (optional)</label>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            {(['clean', 'rebuilt'] as const).map((titleType) => (
              <div key={titleType} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={() => onUserProfileChange({ ...userProfile, titleType })}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: userProfile.titleType === titleType ? 'var(--accent)' : 'transparent',
                    color: userProfile.titleType === titleType ? 'var(--accent-foreground)' : 'var(--foreground)',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 200ms',
                  }}
                  onMouseEnter={(e) => {
                    if (userProfile.titleType !== titleType) {
                      e.currentTarget.style.backgroundColor = 'var(--border)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (userProfile.titleType !== titleType) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {titleType === 'clean' ? 'Clean' : 'Rebuilt'}
                </button>
                <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontWeight: '400' }}>
                  {titleType === 'clean' ? 'Standard' : 'Save Money'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Match Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', gridColumn: '1 / -1' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={userProfile.matchModeEnabled}
              onChange={(e) => onMatchModeChange(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--foreground)' }}>Match Mode</div>
              <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>Match me to what I can actually afford right now</div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
