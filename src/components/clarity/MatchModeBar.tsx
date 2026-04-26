'use client';

import { useState } from 'react';
import { UserProfile, CreditTier } from '@/lib/search-demo/types';
import { getCreditColor, getCreditLabel } from '@/lib/search-demo/matchModeUtils';

interface MatchModeBarProps {
  userProfile: UserProfile;
  onMatchModeChange: (enabled: boolean) => void;
  onUserProfileChange: (profile: UserProfile) => void;
}

export default function MatchModeBar({ userProfile, onMatchModeChange, onUserProfileChange }: MatchModeBarProps) {
  const [location, setLocation] = useState('');
  const [needByDate, setNeedByDate] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [trim, setTrim] = useState('');

  const creditTier: CreditTier = userProfile.creditScore >= 700 ? 'green' : userProfile.creditScore >= 620 ? 'yellow' : 'red';

  return (
    <div style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--card)', padding: '16px 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
        {/* Location */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--muted-foreground)' }}>Location</label>
          <input
            type="text"
            placeholder="City or ZIP"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontSize: '14px' }}
          />
        </div>

        {/* Need By */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--muted-foreground)' }}>Need By</label>
          <input
            type="date"
            value={needByDate}
            onChange={(e) => setNeedByDate(e.target.value)}
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontSize: '14px' }}
          />
        </div>

        {/* Make */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--muted-foreground)' }}>Make</label>
          <input
            type="text"
            placeholder="e.g., Toyota"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontSize: '14px' }}
          />
        </div>

        {/* Model */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--muted-foreground)' }}>Model</label>
          <input
            type="text"
            placeholder="e.g., Camry"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontSize: '14px' }}
          />
        </div>

        {/* Year */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--muted-foreground)' }}>Year</label>
          <input
            type="number"
            placeholder="2020"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            min="1990"
            max={new Date().getFullYear()}
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontSize: '14px' }}
          />
        </div>

        {/* Mileage */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--muted-foreground)' }}>Mileage</label>
          <select
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontSize: '14px' }}
          >
            <option value="">Any</option>
            <option value="50k">Under 50k</option>
            <option value="100k">50k-100k</option>
            <option value="150k">100k-150k</option>
            <option value="150k+">150k+</option>
          </select>
        </div>

        {/* Trim */}
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

        {/* Available Cash Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--muted-foreground)' }}>Available Cash Right Now</label>
          <input
            type="number"
            value={userProfile.availableCash}
            onChange={(e) => onUserProfileChange({ ...userProfile, availableCash: parseInt(e.target.value) || 0 })}
            placeholder="$0"
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontSize: '14px' }}
          />
        </div>

        {/* Credit Score Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--muted-foreground)' }}>Credit Score</label>
          <input
            type="number"
            value={userProfile.creditScore}
            onChange={(e) => onUserProfileChange({ ...userProfile, creditScore: parseInt(e.target.value) || 500 })}
            placeholder="650"
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontSize: '14px' }}
          />
        </div>

        {/* Credit Tier Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '6px', backgroundColor: `${getCreditColor(creditTier)}20`, border: `1px solid ${getCreditColor(creditTier)}` }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getCreditColor(creditTier) }}></div>
          <span style={{ fontSize: '13px', fontWeight: '500', color: getCreditColor(creditTier) }}>Your Risk Tier: {getCreditLabel(creditTier)}</span>
        </div>

        {/* Title Type Toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--muted-foreground)' }}>Title</label>
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
