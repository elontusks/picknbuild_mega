// @ts-nocheck — demo lift; strict TS errors to fix when wiring real services
'use client';

import { useEffect, useRef, useState } from 'react';
import { Car, IntakeFilters, UserProfile } from '@/lib/search-demo/types';
import ColumnContainer from '../ColumnContainer';
import CarCard from '../CarCard';
import SponsorArea from '../SponsorArea';
import AffordabilityBadge from '../AffordabilityBadge';
import PriceAffordabilityIndicator from '../PriceAffordabilityIndicator';
import { calculateAuctionAffordability, getCreditTier } from '@/lib/search-demo/matchModeUtils';
import { estimateAuctionBid, formatCurrency } from '@/lib/search-demo/pricingCalculations';
import { parseLinkAndConvert } from '@/lib/search-demo/parse-link-client';

export type LiveScrapeState = 'idle' | 'pending' | 'success' | 'unavailable' | 'error';

interface ColumnProps {
  cars: Car[];
  onPick: (car: Car) => void;
  onSelect: (car: Car) => void;
  onCarParsed?: (car: Car) => void;
  onRequestLiveScrape?: () => void;
  liveScrapeState?: LiveScrapeState;
  intakeFilters?: IntakeFilters;
  userProfile: UserProfile;
  initialCount?: number;
}

export default function AuctionDIYColumn({
  cars,
  onPick,
  onSelect,
  onCarParsed,
  onRequestLiveScrape,
  liveScrapeState = 'idle',
  intakeFilters,
  userProfile,
  initialCount,
}: ColumnProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
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
    const result = await parseLinkAndConvert(pastedUrl, 'auction');
    setParsing(false);

    if (result.ok) {
      if (onCarParsed) onCarParsed(result.car);
      else onSelect(result.car);
      setPastedUrl('');
    } else {
      setParseError(result.reason);
    }
  };

  // Auto-trigger live-scrape exactly once per (filters, mount) when the
  // auction pool is empty AND the user has typed enough of a search to make
  // the scrape meaningful. Without make/model the upstream orchestrator
  // would do a wide-open crawl, which is wasted work — so we gate on those.
  const hasSearch = Boolean(intakeFilters?.make?.trim() || intakeFilters?.model?.trim());
  const autoTriggeredRef = useRef(false);
  useEffect(() => {
    if (cars.length > 0) return;
    if (!hasSearch) return;
    if (liveScrapeState !== 'idle') return;
    if (autoTriggeredRef.current) return;
    if (!onRequestLiveScrape) return;
    autoTriggeredRef.current = true;
    onRequestLiveScrape();
  }, [cars.length, hasSearch, liveScrapeState, onRequestLiveScrape]);

  const subtitle = userProfile.matchModeEnabled && initialCount && cars.length < initialCount
    ? `Showing ${cars.length} affordable`
    : "Lowest Price";

  if (cars.length === 0) {
    const scrapeStatusMessage =
      liveScrapeState === 'pending'
        ? 'Searching Copart, IAAI, and other sources for matching cars…'
        : liveScrapeState === 'unavailable'
        ? 'Live search is offline right now. You can still paste an auction link below.'
        : liveScrapeState === 'error' && !hasSearch
        ? 'Add a make or model to your search and we&apos;ll run a live scrape for matching auctions.'
        : liveScrapeState === 'error'
        ? 'Couldn&apos;t reach the live search. Try paste-a-link below.'
        : liveScrapeState === 'success'
        ? 'No auction matches yet — try widening your filters, or paste an auction link below.'
        : hasSearch
        ? 'No auction matches yet for this search.'
        : 'No auction options available. Add a make or model, or paste an auction link below.';

    return (
      <ColumnContainer
        title="Auction / DIY"
        subtitle={subtitle}
        description="Insurance and salvage auctions. Handle bidding and repairs yourself."
      >
        <div data-testid="auction-empty" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '4px 0' }}>
          <div
            data-testid="auction-empty-status"
            data-state={liveScrapeState}
            style={{ fontSize: '12px', color: 'var(--muted-foreground)', lineHeight: 1.5 }}
          >
            {scrapeStatusMessage}
          </div>

          {hasSearch && (liveScrapeState === 'idle' || liveScrapeState === 'error' || liveScrapeState === 'unavailable') && onRequestLiveScrape ? (
            <button
              type="button"
              data-testid="auction-live-scrape-button"
              onClick={() => onRequestLiveScrape()}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '4px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--background)',
                color: 'var(--foreground)',
                cursor: 'pointer',
              }}
            >
              {liveScrapeState === 'idle' ? 'Search live now' : 'Try live search again'}
            </button>
          ) : null}

          <div style={{ padding: '12px', backgroundColor: 'var(--muted)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', marginBottom: '8px', textTransform: 'uppercase' }}>
              Paste an auction listing
            </div>
            <input
              type="text"
              placeholder="Paste Copart / IAAI link"
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
              <div role="alert" style={{ fontSize: '11px', color: '#dc2626', marginTop: '6px', padding: '6px 8px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '4px' }}>
                {parseError}
              </div>
            )}
          </div>
        </div>
      </ColumnContainer>
    );
  }

  const currentCar = cars[currentIndex];
  const remaining = cars.length - currentIndex - 1;
  const creditTier = getCreditTier(userProfile.creditScore);
  
  // Get market value and current bid
  const marketValue = currentCar.acv || 20000;
  // Current bid is typically 60-70% of market value to start
  const currentBid = Math.round(marketValue * 0.65);
  
  // Estimate auction final bid and repairs
  const auctionEstimate = estimateAuctionBid(
    marketValue,
    currentBid,
    userProfile.titleType ?? 'clean',
    currentCar.mileage,
    currentCar.explanation
  );
  
  // Calculate total cash needed for affordability
  const totalCashNeeded = auctionEstimate.totalDIYCostMax || auctionEstimate.totalDIYCost;
  const affordability = calculateAuctionAffordability(userProfile, auctionEstimate.estimatedFinalBid, auctionEstimate.repairsMin || 1000);
  
  // Helper to display repairs
  const repairsDisplay = () => {
    if (auctionEstimate.repairsState === 'unknown') {
      return 'Unknown';
    } else if (auctionEstimate.repairsState === 'range' && auctionEstimate.repairsMin && auctionEstimate.repairsMax) {
      return `${formatCurrency(auctionEstimate.repairsMin)}–${formatCurrency(auctionEstimate.repairsMax)}`;
    }
    return 'Unknown';
  };
  
  const rebuiltDisplay = userProfile.titleType === 'rebuilt' ? ' ↓' : '';

  return (
    <ColumnContainer
      title="Auction DIY"
      subtitle={subtitle}
      description="Insurance & salvage auctions. Handle bidding and repairs yourself."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
        {/* Found a Better Deal - Link Parser */}
        <div style={{ padding: '12px', backgroundColor: 'var(--muted)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', marginBottom: '8px', textTransform: 'uppercase' }}>Already found a car? Compare it here.</div>
          <input
            type="text"
            placeholder="Paste auction link"
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
        {/* Match Mode Info */}
        {userProfile.matchModeEnabled && (
          <div style={{ padding: '12px', backgroundColor: 'var(--muted)', borderRadius: '8px', fontSize: '12px', color: 'var(--foreground)' }}>
            <div style={{ marginBottom: '12px', fontWeight: '600' }}>DIY Auction Costs:</div>
            
            {/* Price Affordability Indicator */}
            <PriceAffordabilityIndicator totalPrice={totalCashNeeded} affordability={affordability} label="Total Cash Needed" />

            {/* Auction Bid Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', marginTop: '12px' }}>
              {/* Title Badge */}
              <div style={{ display: 'inline-block', width: 'fit-content', fontSize: '10px', fontWeight: '600', padding: '4px 8px', backgroundColor: userProfile.titleType === 'rebuilt' ? '#fbbf24' : '#10b981', color: userProfile.titleType === 'rebuilt' ? '#78350f' : '#065f46', borderRadius: '4px', textTransform: 'uppercase', marginBottom: '8px' }}>
                {userProfile.titleType === 'rebuilt' ? 'Rebuilt Title' : 'Clean Title'}
              </div>

              {/* Cash Only Badge */}
              <div style={{ display: 'inline-block', width: 'fit-content', fontSize: '10px', fontWeight: '600', padding: '4px 8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '4px', textTransform: 'uppercase', marginBottom: '8px' }}>
                Cash Only
              </div>

              {/* Current Bid */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Current Bid{rebuiltDisplay}</span>
                <span style={{ fontWeight: '600' }}>{formatCurrency(auctionEstimate.currentBid)}</span>
              </div>
              
              {/* Estimated Final Bid */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Estimated Final Bid</span>
                <span style={{ fontWeight: '600', color: 'var(--accent)' }}>TBD</span>
              </div>
              
              {/* Estimated Repairs */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Repairs</span>
                <span style={{ fontWeight: '600' }}>Unknown</span>
              </div>
              
              {/* Fees (includes auction, shipping, procurement) */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Fees</span>
                <span style={{ fontWeight: '600' }}>$3,000</span>
              </div>

              {/* Tax */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Tax (8.5%)</span>
                <span style={{ fontWeight: '600' }}>TBD</span>
              </div>
              
              {/* Total DIY Cost */}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border)', fontWeight: '700' }}>
                <span>Estimated Total DIY Cost</span>
                <span style={{ color: 'var(--accent)' }}>TBD</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '4px' }}>Final cost depends on auction outcome.</div>
            </div>

            {/* No Credit Needed Badge */}
            <div style={{ marginTop: '12px', fontSize: '11px', padding: '8px', backgroundColor: 'var(--background)', borderRadius: '4px', color: 'var(--accent)' }}>
              ✓ No credit required
            </div>

            {/* Effort and Uncertainty Labels */}
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', fontSize: '11px' }}>
              <div style={{ padding: '4px 8px', backgroundColor: 'var(--background)', borderRadius: '4px', color: 'var(--muted-foreground)' }}>
                Higher Effort
              </div>
              <div style={{ padding: '4px 8px', backgroundColor: 'var(--background)', borderRadius: '4px', color: 'var(--muted-foreground)' }}>
                Higher Uncertainty
              </div>
            </div>

            {/* Affordability Badge */}
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
              <AffordabilityBadge state={affordability} creditTier={creditTier} />
            </div>

            {/* Risk Type */}
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', marginBottom: '4px', textTransform: 'uppercase' }}>Risk Type</div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '4px' }}>Unknown Risk</div>
              <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', lineHeight: '1.4' }}>Final cost depends on bidding, repairs, and parts.</div>
            </div>
          </div>
        )}

        {/* Auction-specific sponsor area */}
        <SponsorArea
          title="DIY Support"
          description="Parts, tools, transport, and repair services"
          variant="auction"
        />

        <div style={{ flex: 1, minHeight: 0 }}>
          <CarCard
            car={currentCar}
            onPick={onPick}
            onPass={() => setCurrentIndex(Math.min(currentIndex + 1, cars.length - 1))}
            onSelect={onSelect}
            priceLabel="Est. Total DIY Cost"
            totalPrice={totalCashNeeded}
            affordability={affordability}
          />
        </div>

        {remaining > 0 && (
          <div style={{ fontSize: '12px', textAlign: 'center', color: 'var(--muted-foreground)' }}>
            +{remaining} more auction option{remaining === 1 ? '' : 's'}
          </div>
        )}
      </div>
    </ColumnContainer>
  );
}