'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { UserProfile, CreditTier, TitleType, IntakeFilters } from '@/lib/search-demo/types';
import {
  VEHICLE_MAKES,
  VEHICLE_YEARS,
  getModelsForMake,
} from '@/lib/search-demo/vehicle-catalog';

const CREDIT_SCORE_MIN = 300;
const CREDIT_SCORE_MAX = 850;

interface MatchModeBarProps {
  userProfile: UserProfile;
  userZip: string;
  intakeFilters: IntakeFilters;
  onIntakeFiltersChange: (next: IntakeFilters) => void;
  onMatchModeChange: (enabled: boolean) => void;
  onUserProfileChange: (profile: UserProfile) => void;
}

const requiredMark = (
  <span aria-hidden="true" style={{ color: '#dc2626', marginLeft: '2px' }}>*</span>
);

const inputStyle: React.CSSProperties = {
  padding: '8px',
  borderRadius: '6px',
  border: '1px solid var(--border)',
  backgroundColor: 'var(--background)',
  color: 'var(--foreground)',
  fontSize: '14px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 500,
  color: 'var(--muted-foreground)',
};

export default function MatchModeBar({
  userProfile,
  userZip,
  intakeFilters,
  onIntakeFiltersChange,
  onMatchModeChange,
  onUserProfileChange,
}: MatchModeBarProps) {
  const { make, model, year, mileageBucket: mileage, trim } = intakeFilters;
  const [creditScoreText, setCreditScoreText] = useState<string>(
    userProfile.creditScore ? String(userProfile.creditScore) : '',
  );
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const creditTier: CreditTier =
    userProfile.creditScore >= 700
      ? 'green'
      : userProfile.creditScore >= 620
        ? 'yellow'
        : 'red';

  const availableModels = useMemo(() => getModelsForMake(make), [make]);

  // Keep local input in sync if profile is updated from outside (initial load)
  useEffect(() => {
    if (userProfile.hasNoCredit) {
      setCreditScoreText('');
      return;
    }
    const next = userProfile.creditScore ? String(userProfile.creditScore) : '';
    setCreditScoreText((prev) => (prev === next ? prev : next));
  }, [userProfile.creditScore, userProfile.hasNoCredit]);

  // Debounced save of profile changes
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const saveProfile = async () => {
        try {
          await fetch('/api/users/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              availableCash: userProfile.availableCash,
              creditScore: userProfile.creditScore,
              zip: userZip,
              titleType: userProfile.titleType ?? null,
            }),
          });
        } catch (err) {
          console.error('Failed to save profile:', err);
        }
      };
      saveProfile();
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [userProfile.availableCash, userProfile.creditScore, userProfile.titleType, userZip]);

  const handleMakeChange = (next: string) => {
    const nextModel = model && !getModelsForMake(next).includes(model) ? '' : model;
    onIntakeFiltersChange({ ...intakeFilters, make: next, model: nextModel });
  };

  const handleModelChange = (next: string) => {
    onIntakeFiltersChange({ ...intakeFilters, model: next });
  };

  const handleYearChange = (next: string) => {
    onIntakeFiltersChange({ ...intakeFilters, year: next });
  };

  const handleMileageChange = (next: string) => {
    onIntakeFiltersChange({
      ...intakeFilters,
      mileageBucket: next as IntakeFilters['mileageBucket'],
    });
  };

  const handleTrimChange = (next: string) => {
    onIntakeFiltersChange({ ...intakeFilters, trim: next });
  };

  const handleCreditScoreChange = (raw: string) => {
    setCreditScoreText(raw);
    if (raw === '') return;
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed)) return;
    const clamped = Math.min(CREDIT_SCORE_MAX, Math.max(CREDIT_SCORE_MIN, parsed));
    onUserProfileChange({ ...userProfile, creditScore: clamped, hasNoCredit: false });
  };

  const handleCreditBlur = () => {
    if (creditScoreText === '') return;
    const parsed = parseInt(creditScoreText, 10);
    if (Number.isNaN(parsed)) {
      setCreditScoreText(userProfile.creditScore ? String(userProfile.creditScore) : '');
      return;
    }
    const clamped = Math.min(CREDIT_SCORE_MAX, Math.max(CREDIT_SCORE_MIN, parsed));
    setCreditScoreText(String(clamped));
    onUserProfileChange({ ...userProfile, creditScore: clamped, hasNoCredit: false });
  };

  const handleTitleChange = (next: TitleType | '') => {
    onUserProfileChange({
      ...userProfile,
      titleType: next === '' ? undefined : next,
    });
  };

  return (
    <div style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--card)', padding: '16px 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
        {/* Location — auto-filled from user record, read-only */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={labelStyle}>Location (ZIP)</label>
          <input
            type="text"
            value={userZip}
            readOnly
            aria-readonly="true"
            title="Your saved ZIP. Update it from your profile."
            style={{ ...inputStyle, backgroundColor: 'var(--muted)', cursor: 'not-allowed' }}
          />
        </div>

        {/* Make — dropdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="match-mode-make" style={labelStyle}>Make{requiredMark}</label>
          <select
            id="match-mode-make"
            value={make}
            onChange={(e) => handleMakeChange(e.target.value)}
            required
            aria-required="true"
            style={inputStyle}
          >
            <option value="">Select make</option>
            {VEHICLE_MAKES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Model — dropdown, depends on selected make */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="match-mode-model" style={labelStyle}>Model{requiredMark}</label>
          <select
            id="match-mode-model"
            value={model}
            onChange={(e) => handleModelChange(e.target.value)}
            required
            aria-required="true"
            disabled={!make}
            style={{ ...inputStyle, opacity: make ? 1 : 0.6, cursor: make ? 'pointer' : 'not-allowed' }}
          >
            <option value="">{make ? 'Select model' : 'Select make first'}</option>
            {availableModels.map((mdl) => (
              <option key={mdl} value={mdl}>{mdl}</option>
            ))}
          </select>
        </div>

        {/* Year — dropdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="match-mode-year" style={labelStyle}>Year{requiredMark}</label>
          <select
            id="match-mode-year"
            value={year}
            onChange={(e) => handleYearChange(e.target.value)}
            required
            aria-required="true"
            style={inputStyle}
          >
            <option value="">Select year</option>
            {VEHICLE_YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Mileage — required */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="match-mode-mileage" style={labelStyle}>Mileage{requiredMark}</label>
          <select
            id="match-mode-mileage"
            value={mileage}
            onChange={(e) => handleMileageChange(e.target.value)}
            required
            aria-required="true"
            style={inputStyle}
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
          <label htmlFor="match-mode-trim" style={labelStyle}>Trim</label>
          <input
            id="match-mode-trim"
            type="text"
            placeholder="e.g., LE"
            value={trim}
            onChange={(e) => handleTrimChange(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Available Cash (Budget) — required */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="match-mode-cash" style={labelStyle}>Available Cash Right Now{requiredMark}</label>
          <input
            id="match-mode-cash"
            type="number"
            value={userProfile.availableCash}
            onChange={(e) => onUserProfileChange({ ...userProfile, availableCash: parseInt(e.target.value, 10) || 0 })}
            placeholder="$0"
            min={0}
            required
            aria-required="true"
            style={inputStyle}
          />
        </div>

        {/* Credit Score — actual numeric score (300–850) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="match-mode-credit" style={labelStyle}>
            Credit Score ({CREDIT_SCORE_MIN}–{CREDIT_SCORE_MAX})
          </label>
          <input
            id="match-mode-credit"
            type="number"
            inputMode="numeric"
            min={CREDIT_SCORE_MIN}
            max={CREDIT_SCORE_MAX}
            step={1}
            placeholder="e.g., 720"
            value={userProfile.hasNoCredit ? '' : creditScoreText}
            disabled={userProfile.hasNoCredit}
            onChange={(e) => handleCreditScoreChange(e.target.value)}
            onBlur={handleCreditBlur}
            style={{
              ...inputStyle,
              opacity: userProfile.hasNoCredit ? 0.5 : 1,
              cursor: userProfile.hasNoCredit ? 'not-allowed' : 'text',
            }}
          />
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--muted-foreground)',
              cursor: 'pointer',
              userSelect: 'none',
              marginTop: '2px',
            }}
          >
            <input
              type="checkbox"
              checked={!!userProfile.hasNoCredit}
              onChange={(e) => onUserProfileChange({ ...userProfile, hasNoCredit: e.target.checked })}
              style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: 'var(--accent)' }}
            />
            No credit
          </label>
        </div>

        {/* Risk Tier Badge */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={labelStyle}>Risk Tier</label>
          <div
            style={{
              display: 'block',
              padding: '8px 12px',
              borderRadius: '6px',
              backgroundColor:
                creditTier === 'green'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : creditTier === 'yellow'
                    ? 'rgba(251, 191, 36, 0.15)'
                    : 'rgba(248, 113, 113, 0.15)',
              color:
                creditTier === 'green'
                  ? '#10b981'
                  : creditTier === 'yellow'
                    ? '#fbbf24'
                    : '#f87171',
              fontSize: '13px',
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            {creditTier === 'green'
              ? 'Low Risk'
              : creditTier === 'yellow'
                ? 'Medium Risk'
                : 'High Risk'}
          </div>
        </div>

        {/* Title Type — optional dropdown: Any / Clean / Rebuilt */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="match-mode-title" style={labelStyle}>Title (optional)</label>
          <select
            id="match-mode-title"
            value={userProfile.titleType ?? ''}
            onChange={(e) => handleTitleChange(e.target.value as TitleType | '')}
            style={inputStyle}
          >
            <option value="">Any (no preference)</option>
            <option value="clean">Clean</option>
            <option value="rebuilt">Rebuilt</option>
          </select>
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
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--foreground)' }}>Match Mode</div>
              <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                Match me to what I can actually afford right now
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
