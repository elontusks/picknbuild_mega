// @ts-nocheck — demo lift; strict TS errors to fix when wiring real services
'use client';

import { useState } from 'react';
import { Car, UserProfile } from '@/lib/search-demo/types';
import ColumnContainer from '../ColumnContainer';
import CarCard from '../CarCard';
import SponsorArea from '../SponsorArea';
import AffordabilityBadge from '../AffordabilityBadge';
import { calculateIndividualAffordability, getCreditTier } from '@/lib/search-demo/matchModeUtils';
import PriceAffordabilityIndicator from '../PriceAffordabilityIndicator';
import { parseLinkAndConvert } from '@/lib/search-demo/parse-link-client';

interface ColumnProps {
  cars: Car[];
  onPick: (car: Car) => void;
  onSelect: (car: Car) => void;
  userProfile: UserProfile;
  initialCount?: number;
}

export default function IndividualColumn({ cars, onPick, onSelect, userProfile, initialCount }: ColumnProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pastedUrl, setPastedUrl] = useState('');
  const [parsedCar, setParsedCar] = useState<Car | null>(null);
  const [parseError, setParseError] = useState('');
  const [parsing, setParsing] = useState(false);

  const handlePasteUrl = async () => {
    if (!pastedUrl.trim()) {
      setParseError('Please enter a URL');
      return;
    }

    setParsing(true);
    setParseError('');
    const result = await parseLinkAndConvert(pastedUrl, 'individual');
    setParsing(false);

    if (result.ok) {
      setParsedCar(result.car);
      onSelect(result.car);
      setPastedUrl('');
    } else {
      setParseError(result.reason);
    }
  };

  const subtitle = userProfile.matchModeEnabled && initialCount && cars.length < initialCount
    ? `Showing ${cars.length} affordable`
    : "Lowest Cost";

  if (cars.length === 0) {
    return (
      <ColumnContainer
        title="Individual"
        subtitle={subtitle}
        description="Buy directly from the seller. Inspect and negotiate yourself."
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '14px', color: 'var(--muted-foreground)' }}>
          No individual listings available
        </div>
      </ColumnContainer>
    );
  }

  const currentCar = cars[currentIndex];
  const remaining = cars.length - currentIndex - 1;
  const creditTier = getCreditTier(userProfile.creditScore);
  const sellerPrice = currentCar.acv || 20000;
  const affordability = calculateIndividualAffordability(userProfile, sellerPrice);

  return (
    <ColumnContainer
      title="Individual"
      subtitle={subtitle}
      description="Buy directly from the seller. Inspect and negotiate yourself."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
        {/* Found a Better Deal - Link Parser */}
        <div style={{ padding: '12px', backgroundColor: 'var(--muted)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', marginBottom: '8px', textTransform: 'uppercase' }}>Already found a car? Compare it here.</div>
          <input
            type="text"
            placeholder="Paste private seller link"
            value={pastedUrl}
            onChange={(e) => setPastedUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handlePasteUrl()}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '12px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)',
              marginBottom: '6px',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={handlePasteUrl}
            disabled={parsing}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: '600',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-foreground)',
              cursor: parsing ? 'not-allowed' : 'pointer',
              opacity: parsing ? 0.6 : 1,
            }}
          >
            {parsing ? 'Parsing…' : 'Parse Listing'}
          </button>
          {parseError && (
            <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '6px', padding: '6px 8px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '4px' }}>
              {parseError}
            </div>
          )}
          {parsedCar && (
            <div style={{ fontSize: '11px', color: '#059669', marginTop: '6px', padding: '6px 8px', backgroundColor: 'rgba(5, 150, 105, 0.1)', borderRadius: '4px' }}>
              ✓ Listing loaded: {parsedCar.year} {parsedCar.make} {parsedCar.model}
            </div>
          )}
        </div>
        {/* Match Mode Info */}
        {userProfile.matchModeEnabled && (
          <div style={{ padding: '12px', backgroundColor: 'var(--muted)', borderRadius: '8px', fontSize: '12px', color: 'var(--foreground)' }}>
            <div style={{ marginBottom: '12px', fontWeight: '600' }}>Individual Seller (Private Sale):</div>
            
            {/* Price Affordability Indicator */}
            <PriceAffordabilityIndicator totalPrice={sellerPrice} affordability={affordability} label="Asking Price" />

            {/* Title Badge */}
            <div style={{ display: 'inline-block', fontSize: '10px', fontWeight: '600', padding: '4px 8px', backgroundColor: userProfile.titleType === 'rebuilt' ? '#fbbf24' : '#10b981', color: userProfile.titleType === 'rebuilt' ? '#78350f' : '#065f46', borderRadius: '4px', marginTop: '8px', marginBottom: '8px', marginRight: '8px', textTransform: 'uppercase' }}>
              {userProfile.titleType === 'rebuilt' ? 'Rebuilt Title' : 'Clean Title'}
            </div>

            {/* Cash Only Badge */}
            <div style={{ display: 'inline-block', fontSize: '10px', fontWeight: '600', padding: '4px 8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '4px', marginBottom: '8px', textTransform: 'uppercase' }}>
              Cash Only
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', marginTop: '12px' }}>
              <div>
                <div style={{ color: 'var(--muted-foreground)', fontSize: '11px' }}>Your Cash</div>
                <div style={{ fontWeight: '600', color: affordability.canAfford ? '#059669' : '#dc2626' }}>${userProfile.availableCash.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ color: 'var(--muted-foreground)', fontSize: '11px' }}>Status</div>
                <div style={{ fontWeight: '600', fontSize: '11px', color: affordability.canAfford ? '#059669' : '#dc2626' }}>
                  {affordability.canAfford ? 'Can Afford' : `Short $${Math.round(affordability.shortBy || 0).toLocaleString()}`}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '12px', fontSize: '11px', padding: '8px', backgroundColor: 'var(--background)', borderRadius: '4px', color: 'var(--accent)' }}>
              ✓ No credit required
            </div>

            {/* Affordability Badge */}
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
              <AffordabilityBadge state={affordability} creditTier={creditTier} />
            </div>

            {/* Risk Type */}
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', marginBottom: '4px', textTransform: 'uppercase' }}>Risk Type</div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '4px' }}>Trust Risk</div>
              <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '1.4' }}>You're relying on the seller and vehicle condition.</div>
            </div>
          </div>
        )}

        {/* Private seller-specific sponsor area */}
        <SponsorArea
          title="Private Sale Protection"
          description="Inspection, payment protection, and title services"
          variant="individual"
        />

        <div style={{ flex: 1, minHeight: 0 }}>
          <CarCard
            car={currentCar}
            onPick={onPick}
            onPass={() => setCurrentIndex(Math.min(currentIndex + 1, cars.length - 1))}
            onSelect={onSelect}
            priceLabel="Asking Price"
            totalPrice={sellerPrice}
            affordability={affordability}
          />
        </div>

        {remaining > 0 && (
          <div style={{ fontSize: '12px', textAlign: 'center', color: 'var(--muted-foreground)' }}>
            +{remaining} more listing{remaining === 1 ? '' : 's'}
          </div>
        )}
      </div>
    </ColumnContainer>
  );
}