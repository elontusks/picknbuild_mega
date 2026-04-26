// @ts-nocheck — demo lift; strict TS errors to fix when wiring real services
'use client';

import { useState, useMemo } from 'react';
import { Car, UserProfile } from '@/lib/search-demo/types';
import ColumnContainer from '../ColumnContainer';
import CarCard from '../CarCard';
import SponsorArea from '../SponsorArea';
import { calculateDealerWithTermByScore, formatCurrency, getDealerAPRByScore, getDealerApprovalStatus, getCreditTier, estimateTradeInValue } from '@/lib/search-demo/pricingCalculations';
import { parseLinkAndConvert } from '@/lib/search-demo/parse-link-client';

interface ColumnProps {
  cars: Car[];
  onPick: (car: Car) => void;
  onSelect: (car: Car) => void;
  userProfile: UserProfile;
}

const TERM_OPTIONS = [
  { months: 36, label: '3Y' },
  { months: 48, label: '4Y' },
  { months: 60, label: '5Y' },
  { months: 72, label: '6Y' },
];

export default function DealerColumn({ cars, onPick, onSelect, userProfile }: ColumnProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTerm, setSelectedTerm] = useState(60);
  const [tradeInVin, setTradeInVin] = useState('');
  const [tradeInTitleType, setTradeInTitleType] = useState<'clean' | 'rebuilt'>('clean');
  const [tradeInValue, setTradeInValue] = useState(0);
  const [pastedUrl, setPastedUrl] = useState('');
  const [parseError, setParseError] = useState('');
  const [parsing, setParsing] = useState(false);

  const handlePasteUrl = async () => {
    if (!pastedUrl.trim()) {
      setParseError('Please enter a URL');
      return;
    }

    setParsing(true);
    setParseError('');
    const result = await parseLinkAndConvert(pastedUrl, 'dealer');
    setParsing(false);

    if (result.ok) {
      onSelect(result.car);
      setPastedUrl('');
    } else {
      setParseError(result.reason);
    }
  };

  if (!cars || cars.length === 0) {
    return (
      <ColumnContainer title="Dealer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          No dealer vehicles available
        </div>
      </ColumnContainer>
    );
  }

  const currentCar = cars[currentIndex];
  const remaining = cars.length - currentIndex - 1;
  const basePrice = currentCar.acv || 25000;
  
  // Calculate trade-in value when VIN is provided
  const calculatedTradeIn = useMemo(() => {
    if (tradeInVin && tradeInVin.length >= 10) {
      return estimateTradeInValue(tradeInVin, tradeInTitleType, basePrice);
    }
    return 0;
  }, [tradeInVin, tradeInTitleType, basePrice]);
  
  // Update displayed trade-in value
  if (calculatedTradeIn !== tradeInValue) {
    setTradeInValue(calculatedTradeIn);
  }
  
  // If hasNoCredit is true, treat as not approved by using score of 0
  const effectiveCreditScore = userProfile.hasNoCredit ? 0 : userProfile.creditScore;
  
  const pricing = useMemo(() => 
    calculateDealerWithTermByScore(basePrice, userProfile.titleType, effectiveCreditScore, selectedTerm),
    [basePrice, userProfile.titleType, effectiveCreditScore, selectedTerm]
  );
  
  const rebuiltDisplay = userProfile.titleType === 'rebuilt' ? ' ↓' : '';
  const isApproved = pricing.isApproved;

  // Get color for APR badge based on score (or not approved if no credit)
  let aprColor = '#22c55e'; // green for good
  if (userProfile.hasNoCredit) {
    aprColor = '#ef4444'; // red for not approved
  } else if (effectiveCreditScore < 680) {
    aprColor = '#ef4444'; // red for poor
  } else if (effectiveCreditScore < 740) {
    aprColor = '#f59e0b'; // amber for fair
  }

  // Helper to create semi-transparent color versions
  const getColorWithOpacity = (color: string, opacity: number) => {
    if (color === '#22c55e') return `rgba(34, 197, 94, ${opacity})`;
    if (color === '#ef4444') return `rgba(239, 68, 68, ${opacity})`;
    if (color === '#f59e0b') return `rgba(245, 158, 11, ${opacity})`;
    return `rgba(0, 0, 0, ${opacity})`;
  };

  const aprColorBg = getColorWithOpacity(aprColor, 0.1);
  const aprColorBorder = getColorWithOpacity(aprColor, 0.4);

  return (
    <ColumnContainer title="Dealer" subtitle="Fastest Access" description="Drive away quickly with dealer financing.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
        {/* Found a Better Deal - Link Parser */}
        <div style={{ padding: '12px', backgroundColor: 'var(--muted)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', marginBottom: '8px', textTransform: 'uppercase' }}>Already found a car? Compare it here.</div>
          <input
            type="text"
            placeholder="Paste dealer link"
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
        </div>
        <div style={{ padding: '16px', backgroundColor: 'var(--muted)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
            <span style={{ color: 'var(--muted-foreground)' }}>Sticker Price{rebuiltDisplay}</span>
            <span style={{ fontWeight: '600' }}>{formatCurrency(pricing.stickerPrice)}</span>
          </div>

          <div style={{ display: 'inline-block', fontSize: '10px', fontWeight: '600', padding: '4px 8px', backgroundColor: userProfile.titleType === 'rebuilt' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', color: userProfile.titleType === 'rebuilt' ? '#ef4444' : '#22c55e', borderRadius: '4px', marginBottom: '12px', textTransform: 'uppercase' }}>
            {userProfile.titleType === 'rebuilt' ? 'Rebuilt Title' : 'Clean Title'}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
            <span style={{ color: 'var(--muted-foreground)' }}>Cash or Finance</span>
            <span style={{ fontWeight: '600', fontSize: '11px' }}>{isApproved ? 'Both options available' : 'Cash Only'}</span>
          </div>

          {isApproved ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700', padding: '6px 12px', backgroundColor: aprColorBg, color: aprColor, borderRadius: '4px', marginBottom: '12px', border: '1px solid ' + aprColorBorder }}>
                <span>APR</span>
                <span>{(pricing.apr * 100).toFixed(1)}%</span>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Trade-In Value
                </div>
                <input
                  type="text"
                  placeholder="Enter vehicle VIN"
                  value={tradeInVin}
                  onChange={(e) => setTradeInVin(e.target.value.toUpperCase())}
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
                {tradeInValue > 0 && (
                  <div style={{ fontSize: '12px', fontWeight: '600', padding: '6px 12px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: '4px', textAlign: 'center' }}>
                    Est. Trade-In: {formatCurrency(tradeInValue)}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Select Term
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {TERM_OPTIONS.map(({ months, label }) => {
                    const isSelected = selectedTerm === months;
                    return (
                      <button
                        key={months}
                        onClick={() => setSelectedTerm(months)}
                        style={{
                          padding: '6px 8px',
                          fontSize: '11px',
                          fontWeight: '600',
                          borderRadius: '4px',
                          border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                          backgroundColor: isSelected ? 'var(--accent)' : 'var(--background)',
                          color: isSelected ? 'var(--accent-foreground)' : 'var(--foreground)',
                          cursor: 'pointer',
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ fontSize: '12px', marginBottom: '12px', padding: '8px', backgroundColor: 'var(--background)', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--muted-foreground)' }}>Est. Down ({(pricing.downPaymentPercentage * 100).toFixed(0)}%)</span>
                  <span style={{ fontWeight: '600' }}>{formatCurrency(pricing.downPayment)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--muted-foreground)' }}>Loan Amount</span>
                  <span style={{ fontWeight: '600' }}>{formatCurrency(pricing.loanAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', paddingTop: '6px', borderTop: '1px solid var(--border)' }}>
                  <span>Est. Monthly ({selectedTerm} mo)</span>
                  <span>{formatCurrency(pricing.monthlyPayment)}</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', padding: '8px 12px', backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)', borderRadius: '4px', marginBottom: '12px' }}>
                <span>Est. Total Paid</span>
                <span>{formatCurrency(pricing.totalPaid)}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', padding: '6px 12px', backgroundColor: 'var(--muted)', borderRadius: '4px', marginBottom: '12px' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Interest Paid</span>
                <span>{formatCurrency(pricing.interestPaid)}</span>
              </div>
              
              <div style={{ padding: '6px 12px', backgroundColor: aprColorBg, color: aprColor, fontSize: '11px', fontWeight: '600', borderRadius: '4px', textAlign: 'center', border: '1px solid ' + aprColorBorder, marginBottom: '12px' }}>
                {pricing.approvalStatus}
              </div>
            </>
          ) : (
            <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '6px', fontSize: '12px', fontWeight: '600', textAlign: 'center', marginBottom: '12px' }}>
              <div style={{ marginBottom: '4px' }}>Most likely not approved</div>
              <div style={{ fontSize: '11px', fontWeight: '400', color: '#dc2626' }}>Limited dealer financing options at this score</div>
            </div>
          )}

          <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', marginBottom: '4px', textTransform: 'uppercase' }}>Risk Type</div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '4px' }}>Financing Risk</div>
            <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '1.4' }}>Risk is built into interest over time.</div>
          </div>
        </div>

        <div style={{ fontSize: '11px', padding: '8px 12px', backgroundColor: 'rgba(59, 130, 246, 0.08)', borderRadius: '6px', color: 'var(--muted-foreground)', border: '1px solid rgba(59, 130, 246, 0.2)', lineHeight: '1.4' }}>
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>Similar monthly payments can result in very different total costs.</div>
          Compare down payment, APR, and term length across credit profiles.
        </div>

        {/* Dealer-specific sponsor area */}
        <SponsorArea
          title="Dealer Support"
          description="Warranty, insurance, GAP coverage, and financing support"
          variant="dealer"
        />

        <div style={{ flex: 1, minHeight: 0 }}>
          <CarCard
            car={currentCar}
            onPick={onPick}
            onPass={() => setCurrentIndex(Math.min(currentIndex + 1, cars.length - 1))}
            onSelect={onSelect}
            priceLabel="Dealer"
            totalPrice={pricing.stickerPrice}
          />
        </div>

        {remaining > 0 && (
          <div style={{ fontSize: '12px', textAlign: 'center', color: 'var(--muted-foreground)' }}>
            +{remaining} more
          </div>
        )}
      </div>
    </ColumnContainer>
  );
}