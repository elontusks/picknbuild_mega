'use client';

import { useState } from 'react';

interface SearchCommandCenterProps {
  onSearch?: (filters: any) => void;
  onEstimateClick?: () => void;
}

export default function SearchCommandCenter({ onSearch, onEstimateClick }: SearchCommandCenterProps) {
  const [filters, setFilters] = useState({
    location: '',
    needByDate: '',
    availableCash: 8000,
    creditScore: 650,
    titleType: 'clean',
    matchMode: false,
    hasNoCredit: false,
    make: '',
    model: '',
    year: '',
    mileage: '',
    trim: '',
  });

  const getRiskTier = (score: number) => {
    if (score >= 700) return { label: 'Low Risk', color: '#dcfce7', textColor: '#166534' };
    if (score >= 620) return { label: 'Medium Risk', color: '#fef3c7', textColor: '#92400e' };
    return { label: 'High Risk', color: '#fee2e2', textColor: '#991b1b' };
  };

  const risk = getRiskTier(filters.creditScore);

  return (
    <div style={{ padding: '24px', backgroundColor: 'var(--background)' }}>
      <div style={{
        backgroundColor: 'var(--card)',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        padding: '20px',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Location</label>
            <input type="text" placeholder="City or ZIP" value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', fontFamily: 'inherit' }} />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Need By</label>
            <input type="date" value={filters.needByDate} onChange={(e) => setFilters({ ...filters, needByDate: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', fontFamily: 'inherit' }} />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Available Cash</label>
            <input type="number" value={filters.availableCash} onChange={(e) => setFilters({ ...filters, availableCash: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', fontFamily: 'inherit' }} />
          </div>
          <div style={{ gridColumn: '1 / 2' }}>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Credit Score</label>
            <select disabled={filters.hasNoCredit} value={filters.creditScore} onChange={(e) => setFilters({ ...filters, creditScore: parseInt(e.target.value) })} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', fontFamily: 'inherit', opacity: filters.hasNoCredit ? 0.5 : 1, cursor: filters.hasNoCredit ? 'not-allowed' : 'pointer' }}>
              <option value={580}>Poor</option>
              <option value={620}>Fair</option>
              <option value={650}>Good</option>
              <option value={720}>Very Good</option>
              <option value={750}>Excellent</option>
            </select>
          </div>
          <div style={{ gridColumn: '1 / 2' }}>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none', marginTop: '0' }}>
              <input 
                type="checkbox" 
                checked={filters.hasNoCredit} 
                onChange={(e) => setFilters({ ...filters, hasNoCredit: e.target.checked })}
                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '13px', fontWeight: '500' }}>No Credit</span>
            </label>
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Risk Tier</label>
            <div style={{ backgroundColor: risk.color, color: risk.textColor, padding: '8px', marginTop: '4px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', textAlign: 'center' }}>
              {risk.label}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Title Type</label>
            <select value={filters.titleType} onChange={(e) => setFilters({ ...filters, titleType: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', fontFamily: 'inherit' }}>
              <option value="clean">Standard (Clean)</option>
              <option value="rebuilt">Save Money (Rebuilt)</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Make</label>
            <input type="text" placeholder="Toyota" value={filters.make} onChange={(e) => setFilters({ ...filters, make: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', fontFamily: 'inherit' }} />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Model</label>
            <input type="text" placeholder="Camry" value={filters.model} onChange={(e) => setFilters({ ...filters, model: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', fontFamily: 'inherit' }} />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Year</label>
            <input type="number" placeholder="2020" value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', fontFamily: 'inherit' }} />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Mileage</label>
            <select value={filters.mileage} onChange={(e) => setFilters({ ...filters, mileage: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', fontFamily: 'inherit' }}>
              <option value="">Any</option>
              <option value="50k">Under 50k</option>
              <option value="100k">50k-100k</option>
              <option value="150k">100k-150k</option>
              <option value="150k+">150k+</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Trim</label>
            <input type="text" placeholder="LE" value={filters.trim} onChange={(e) => setFilters({ ...filters, trim: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', fontFamily: 'inherit' }} />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Match Mode</label>
            <button 
              onClick={() => setFilters({ ...filters, matchMode: !filters.matchMode })}
              title="Match me to what I can actually afford right now"
              style={{ 
                width: '100%', 
                padding: '8px', 
                marginTop: '4px', 
                borderRadius: '6px', 
                border: `2px solid ${filters.matchMode ? 'var(--accent)' : 'var(--border)'}`, 
                backgroundColor: filters.matchMode ? 'var(--accent)' : 'var(--background)', 
                color: filters.matchMode ? 'var(--accent-foreground)' : 'var(--foreground)', 
                fontSize: '13px', 
                fontWeight: '500', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: '700' }}>
                {filters.matchMode ? '✓' : '○'}
              </span>
              <span>{filters.matchMode ? 'Enabled' : 'Off'}</span>
            </button>
          </div>
        </div>

        {/* Secondary CTA - Get Estimate */}
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={onEstimateClick}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(0, 204, 153, 0.3)',
              backgroundColor: 'rgba(0, 204, 153, 0.08)',
              color: 'var(--accent)',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 200ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 204, 153, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(0, 204, 153, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 204, 153, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(0, 204, 153, 0.3)';
            }}
          >
            Already have a car? Get an estimate to upgrade or fix it
          </button>
        </div>
      </div>
    </div>
  );
}
