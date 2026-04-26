// @ts-nocheck — demo lift; strict TS errors to fix when wiring real services
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Car, UserProfile } from '@/lib/search-demo/types';
import ColumnContainer from '../ColumnContainer';
import CarCard from '../CarCard';
import SponsorArea from '../SponsorArea';
import BuildAttachmentArea, { BuildAttachment } from '../BuildAttachmentArea';
import PicknbuildBrand from '@/components/PicknbuildBrand';
import {
  calculatePickAndBuildWithContinuousRisk,
  getAvailablePickAndBuildTermsWithContinuousRisk,
  formatCurrency,
  getCreditTier,
  getCreditTierColor,
  getCreditTierLabel,
  estimateTradeInValue,
} from '@/lib/search-demo/pricingCalculations';

interface ColumnProps {
  cars: Car[];
  onPick: (car: Car) => void;
  onSelect: (car: Car) => void;
  userProfile: UserProfile;
  onReferralClick?: () => void;
  initialCount?: number;
}

const TERM_OPTIONS = [
  { months: 12, label: '1 Year' },
  { months: 24, label: '2 Years' },
  { months: 36, label: '3 Years' },
  { months: 48, label: '4 Years' },
  { months: 60, label: '5 Years' },
];

export default function PickNBuildColumn({ cars, onPick, onSelect, userProfile, onReferralClick, initialCount }: ColumnProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTerm, setSelectedTerm] = useState(60);
  const [tradeInVin, setTradeInVin] = useState('');
  const [tradeInTitleType, setTradeInTitleType] = useState<'clean' | 'rebuilt'>('clean');
  const [tradeInValue, setTradeInValue] = useState(0);
  const [buildAttachments, setBuildAttachments] = useState<BuildAttachment[]>([]);
  
  // Customization add-ons (completely separate from financing)
  const [selectedAddOns, setSelectedAddOns] = useState<{ [key: string]: boolean }>({
    wrap: false,
    seats: false,
    starlight: false,
    paint: false,
  });
  
  // Shipping toggle
  const [includeShipping, setIncludeShipping] = useState(false);
  const SHIPPING_COST = 1500; // Optional shipping cost
  
  // Cash price toggle
  const [isCashPrice, setIsCashPrice] = useState(false);

  const addOnsOptions = [
    { id: 'wrap', label: 'Wrap', price: 4000 },
    { id: 'seats', label: 'Seats', price: 4000 },
    { id: 'starlight', label: 'Starlight', price: 1500 },
    { id: 'paint', label: 'Paint', price: 3500 },
  ];

  const addOnsTotal = useMemo(() => {
    return addOnsOptions.reduce((total, option) => {
      return total + (selectedAddOns[option.id] ? option.price : 0);
    }, 0);
  }, [selectedAddOns]);

  // Calculate trade-in value when VIN is provided
  const calculatedTradeIn = useMemo(() => {
    if (tradeInVin && tradeInVin.length >= 10) {
      return estimateTradeInValue(tradeInVin, tradeInTitleType, userProfile.titleType === 'rebuilt' ? undefined : undefined);
    }
    return 0;
  }, [tradeInVin, tradeInTitleType]);
  
  // Update displayed trade-in value
  if (calculatedTradeIn !== tradeInValue) {
    setTradeInValue(calculatedTradeIn);
  }

  const subtitle = userProfile.matchModeEnabled && initialCount && cars.length < initialCount
    ? `Showing ${cars.length} affordable`
    : "Best Value";

  if (cars.length === 0) {
    return (
      <ColumnContainer
        title={<PicknbuildBrand />}
        subtitle={subtitle}
        description="We curate, inspect, and handle everything for you."
        highlighted
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '14px', color: 'var(--muted-foreground)' }}>
          No pick & build options available
        </div>
      </ColumnContainer>
    );
  }

  const currentCar = cars[currentIndex];
  const remaining = cars.length - currentIndex - 1;
  const basePrice = currentCar.acv || 25000;
  
  // Use continuous risk: pass null for credit score if no credit, otherwise pass the actual score
  const effectiveCreditScore = userProfile.hasNoCredit ? null : userProfile.creditScore;
  
  const availableTerms = useMemo(() => 
    getAvailablePickAndBuildTermsWithContinuousRisk(basePrice, userProfile.titleType, effectiveCreditScore),
    [basePrice, userProfile.titleType, effectiveCreditScore]
  );
  
  const effectiveTerm = availableTerms.includes(selectedTerm) ? selectedTerm : availableTerms[0];
  
  const pricing = useMemo(() =>
    calculatePickAndBuildWithContinuousRisk(
      basePrice,
      userProfile.titleType,
      effectiveCreditScore,
      effectiveTerm,
      addOnsTotal,
      includeShipping ? SHIPPING_COST : 0,
      isCashPrice
    ),
    [basePrice, userProfile.titleType, effectiveCreditScore, effectiveTerm, addOnsTotal, includeShipping, isCashPrice]
  );
  
  const rebuiltDisplay = userProfile.titleType === 'rebuilt' ? ' ↓' : '';
  const tierColor = getCreditTierColor(pricing.riskTier);
  const tierLabel = getCreditTierLabel(pricing.riskTier);

  return (
    <ColumnContainer
      title={<PicknbuildBrand />}
      subtitle={subtitle}
      description="Everyone's approved, no searching, no repairs. You pick. We build."
      highlighted
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
        <div style={{ padding: '16px', backgroundColor: 'var(--muted)', borderRadius: '8px', border: '1px solid var(--border)', position: 'relative', paddingTop: '50px' }}>
          {/* Build it your way Badge - PROMINENT */}
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '800',
            padding: '8px 16px',
            backgroundColor: 'var(--accent)',
            color: 'var(--accent-foreground)',
            borderRadius: '20px',
            whiteSpace: 'nowrap',
            zIndex: 100,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          }}>
            ⭐ Build Your Way
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
            <span style={{ color: 'var(--muted-foreground)' }}>Vehicle Price{rebuiltDisplay}</span>
            <span style={{ fontWeight: '600' }}>{formatCurrency(pricing.vehiclePrice)}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '4px' }}>
            <span>Tax (8.5%)</span>
            <span>{formatCurrency(pricing.tax)}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '4px' }}>
            <span>Title Fee</span>
            <span>$50</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '4px' }}>
            <span>Registration Fee</span>
            <span>$35</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '12px' }}>
            <span>Documentation</span>
            <span>$1,000</span>
          </div>

          <div style={{ display: 'inline-block', fontSize: '10px', fontWeight: '600', padding: '4px 8px', backgroundColor: userProfile.titleType === 'rebuilt' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', color: userProfile.titleType === 'rebuilt' ? '#ef4444' : '#22c55e', borderRadius: '4px', marginBottom: '12px', marginRight: '8px', textTransform: 'uppercase' }}>
            {userProfile.titleType === 'rebuilt' ? 'Rebuilt Title' : 'Clean Title'}
          </div>

          <div style={{ display: 'inline-block', fontSize: '10px', fontWeight: '600', padding: '4px 8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '4px', marginBottom: '12px', textTransform: 'uppercase' }}>
            Cash or Finance
          </div>
          
          <div
            style={{
              display: 'inline-block',
              fontSize: '10px',
              fontWeight: '600',
              padding: '4px 8px',
              backgroundColor: `${tierColor}20`,
              color: tierColor,
              borderRadius: '4px',
              marginBottom: '12px',
              textTransform: 'uppercase',
            }}
          >
            {tierLabel}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '700', paddingTop: '8px', borderTop: '1px solid var(--border)', marginBottom: '12px' }}>
            <span>Total Price</span>
            <span>{formatCurrency(pricing.totalPrice)}</span>
          </div>
          
          {/* Optional Shipping Toggle - under total price */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'rgba(59, 130, 246, 0.08)', borderRadius: '6px', marginBottom: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={includeShipping}
                onChange={(e) => setIncludeShipping(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Shipping
            </label>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#3b82f6' }}>+${SHIPPING_COST.toLocaleString()}</span>
          </div>
          
          <div style={{ fontSize: '12px', marginBottom: '12px' }}>
            {isCashPrice ? (
              // CASH MODE: Show simple cash total
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Total Cash Price</span>
                <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--accent)' }}>{formatCurrency(pricing.totalPrice)}</span>
              </div>
            ) : (
              // FINANCED MODE: Show financing breakdown
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--muted-foreground)' }}>Term Risk {pricing.termRiskPercentage > 0 ? `(${(pricing.termRiskPercentage * 100).toFixed(1)}%)` : ''}</span>
                  <span style={{ fontWeight: '600' }}>{formatCurrency(pricing.riskAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--muted-foreground)' }}>Down (35%)</span>
                  <span style={{ fontWeight: '600' }}>{formatCurrency(pricing.downPayment)}</span>
                </div>
              </>
            )}
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
              <div style={{ fontSize: '12px', fontWeight: '600', padding: '6px 12px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: '4px', textAlign: 'center', marginBottom: '6px' }}>
                Est. Trade-In: {formatCurrency(tradeInValue)}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                Select Term
              </div>
              <button
                onClick={() => setIsCashPrice(!isCashPrice)}
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  borderRadius: '4px',
                  border: isCashPrice ? '2px solid var(--accent)' : '1px solid var(--border)',
                  backgroundColor: isCashPrice ? 'var(--accent)' : 'var(--background)',
                  color: isCashPrice ? 'var(--accent-foreground)' : 'var(--foreground)',
                  cursor: 'pointer',
                  transition: 'all 200ms',
                }}
                onMouseEnter={(e) => !isCashPrice && (e.currentTarget.style.backgroundColor = 'var(--muted)')}
                onMouseLeave={(e) => !isCashPrice && (e.currentTarget.style.backgroundColor = 'var(--background)')}
              >
                💵 Cash
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
              {TERM_OPTIONS.map(({ months, label }) => {
                const isAvailable = availableTerms.includes(months);
                const isSelected = effectiveTerm === months;
                
                return (
                  <button
                    key={months}
                    onClick={() => isAvailable && setSelectedTerm(months)}
                    disabled={!isAvailable}
                    style={{
                      padding: '6px 8px',
                      fontSize: '11px',
                      fontWeight: '600',
                      borderRadius: '4px',
                      border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                      backgroundColor: isSelected ? 'var(--accent)' : isAvailable ? 'var(--background)' : 'var(--muted)',
                      color: isSelected ? 'var(--accent-foreground)' : isAvailable ? 'var(--foreground)' : 'var(--muted-foreground)',
                      cursor: isAvailable ? 'pointer' : 'not-allowed',
                      transition: 'all 200ms',
                      opacity: isAvailable ? 1 : 0.5,
                    }}
                    onMouseEnter={(e) => isAvailable && !isSelected && (e.currentTarget.style.backgroundColor = 'var(--muted)')}
                    onMouseLeave={(e) => !isSelected && (e.currentTarget.style.backgroundColor = 'var(--background)')}
                  >
                    {isAvailable ? label : 'Not avail'}
                  </button>
                );
              })}
            </div>
          </div>
          
          {!isCashPrice && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700', padding: '8px 12px', backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)', borderRadius: '4px', marginBottom: '12px' }}>
              <span>Bi-Weekly ({pricing.biweeklyPaymentCount} payments)</span>
              <span>{formatCurrency(pricing.biweeklyPayment)}</span>
            </div>
          )}

          <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', marginBottom: '4px', textTransform: 'uppercase' }}>Risk Type</div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '4px' }}>Built-In Risk</div>
            <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '1.4' }}>Risk is included upfront. No interest or surprises.</div>
          </div>

          {/* Customization Add-Ons Section */}
          <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', marginBottom: '8px', textTransform: 'uppercase' }}>Customize</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              {addOnsOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedAddOns({ ...selectedAddOns, [option.id]: !selectedAddOns[option.id] })}
                  style={{
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    borderRadius: '6px',
                    border: selectedAddOns[option.id] ? '2px solid var(--accent)' : '1px solid var(--border)',
                    backgroundColor: selectedAddOns[option.id] ? 'var(--accent)' : 'var(--muted)',
                    color: selectedAddOns[option.id] ? 'var(--accent-foreground)' : 'var(--foreground)',
                    cursor: 'pointer',
                    transition: 'all 200ms',
                  }}
                  title={`${option.label} - $${option.price.toLocaleString()}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {addOnsTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', padding: '8px 12px', backgroundColor: 'var(--muted)', borderRadius: '4px' }}>
                <span>Add-ons</span>
                <span>${addOnsTotal.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Build Attachment Area - Pick & Build Customization */}
        <BuildAttachmentArea
          attachments={buildAttachments}
          onAdd={(attachment) => setBuildAttachments([...buildAttachments, attachment])}
          onRemove={(id) => setBuildAttachments(buildAttachments.filter(a => a.id !== id))}
        />

        <div style={{ fontSize: '11px', padding: '8px 12px', backgroundColor: 'rgba(0, 204, 153, 0.08)', borderRadius: '6px', color: 'var(--muted-foreground)', border: '1px solid rgba(0, 204, 153, 0.2)', lineHeight: '1.4' }}>
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>No interest. One price.</div>
          Risk is built into the price based on your term.
        </div>

        {/* Pick & Build-specific sponsor area for warranty and insurance */}
        <SponsorArea
          title={<><PicknbuildBrand /> protection</>}
          description="Warranty and insurance options"
          variant="picknbuild"
        />

        {/* Start Building Button */}
        <button
          onClick={() => {
            const carListingId = currentCar.listingId || currentCar.id;
            if (carListingId) {
              router.push(`/configurator?listingId=${carListingId}`);
            }
          }}
          style={{
            padding: '12px 16px',
            borderRadius: '6px',
            backgroundColor: 'var(--accent)',
            color: 'var(--accent-foreground)',
            border: 'none',
            fontSize: '14px',
            fontWeight: '600',
            cursor: currentCar.listingId || currentCar.id ? 'pointer' : 'not-allowed',
            transition: 'opacity 200ms',
          }}
          onMouseEnter={(e) => (currentCar.listingId || currentCar.id) && (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          🚀 Start Building
        </button>

        <div style={{ flex: 1, minHeight: 0 }}>
          <CarCard
            car={currentCar}
            onPick={onPick}
            onPass={() => setCurrentIndex(Math.min(currentIndex + 1, cars.length - 1))}
            onSelect={onSelect}
            priceLabel="Pick & Build"
            totalPrice={pricing.totalPrice}
            affordability={undefined}
            matchModeEnabled={userProfile.matchModeEnabled}
          />
        </div>

        {onReferralClick && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '6px',
            backgroundColor: 'var(--accent)',
            color: 'var(--accent-foreground)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ fontSize: '12px', fontWeight: '500', lineHeight: '1.4' }}>
              Need help getting over the line?<br/>
              <span style={{ opacity: 0.9 }}>Invite a friend and earn $500.</span>
            </div>
            <button
              onClick={onReferralClick}
              style={{
                paddingLeft: '12px',
                paddingRight: '12px',
                paddingTop: '6px',
                paddingBottom: '6px',
                borderRadius: '4px',
                backgroundColor: 'var(--accent-foreground)',
                color: 'var(--accent)',
                border: 'none',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 200ms'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Invite
            </button>
          </div>
        )}

        {remaining > 0 && (
          <div style={{ fontSize: '12px', textAlign: 'center', color: 'var(--muted-foreground)' }}>
            +{remaining} more option{remaining === 1 ? '' : 's'}
          </div>
        )}
      </div>
    </ColumnContainer>
  );
}