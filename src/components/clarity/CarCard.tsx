'use client';

import { useState } from 'react';
import { Car, AffordabilityState } from '@/lib/search-demo/types';
import { ThumbsUp, ThumbsDown, ChevronLeft, ChevronRight } from 'lucide-react';
import PriceAffordabilityIndicator from './PriceAffordabilityIndicator';
import PicknbuildBrand from '@/components/PicknbuildBrand';

interface CarCardProps {
  car: Car;
  onPick: (car: Car) => void;
  onPass: () => void;
  onSelect?: (car: Car) => void;
  priceLabel?: string;
  totalPrice?: number;
  downPayment?: number;
  monthlyPayment?: number;
  riskPercentage?: number;
  affordability?: AffordabilityState;
  customMessage?: (affordability: AffordabilityState, downPayment?: number) => string;
  financing?: any; // Financing object from calculateDealerFinancing
  matchModeEnabled?: boolean;
}

export default function CarCard({ car, onPick, onPass, onSelect, priceLabel, totalPrice, downPayment, monthlyPayment, riskPercentage, affordability, customMessage, financing, matchModeEnabled }: CarCardProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = car.gallery && car.gallery.length > 0 ? car.gallery : [car.image];
  const currentPhoto = photos[photoIndex];

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev + 1) % photos.length);
  };
  return (
    <div
      className="flex flex-col h-full rounded-lg border overflow-hidden card-hover transition-all"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
    >
      {/* Image with Gallery Navigation */}
      <div className="relative h-48 overflow-hidden" style={{ backgroundColor: 'var(--muted)' }}>
        <img
          src={currentPhoto}
          alt={`${car.year} ${car.make} ${car.model}`}
          className="w-full h-full object-cover cursor-pointer"
        />
        
        {/* Photo Navigation - Show only if multiple photos */}
        {photos.length > 1 && (
          <>
            <button
              onClick={handlePrevPhoto}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded transition-all z-10"
              aria-label="Previous photo"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNextPhoto}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded transition-all z-10"
              aria-label="Next photo"
            >
              <ChevronRight size={20} />
            </button>
            
            {/* Photo Counter */}
            <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-semibold">
              {photoIndex + 1} / {photos.length}
            </div>
          </>
        )}
        
        <div className="absolute top-2 left-2 text-white px-2 py-1 rounded text-xs font-semibold">
          {car.path === 'dealer' && 'DEALER'}
          {car.path === 'auction' && 'AUCTION'}
          {car.path === 'picknbuild' && <PicknbuildBrand fontSize="12px" fontWeight="700" />}
          {car.path === 'individual' && 'INDIVIDUAL'}
        </div>
      </div>

      {/* Price Indicator - Under Photo */}
      {totalPrice !== undefined && affordability && (
        <div style={{ padding: '8px 12px' }}>
          <PriceAffordabilityIndicator 
            totalPrice={totalPrice} 
            affordability={affordability} 
            label={priceLabel}
            showLabel={true}
            downPayment={downPayment}
            customMessage={customMessage}
          />
        </div>
      )}

      {/* Financing Panel - Under Photo (for Dealer when Match Mode enabled) */}
      {financing && matchModeEnabled && (
        <div style={{ 
          padding: '16px', 
          backgroundColor: 'var(--muted)', 
          fontSize: '12px', 
          color: 'var(--foreground)',
          border: 'none',
          borderTop: '1px solid var(--border)'
        }}>
          <div style={{ marginBottom: '16px', fontWeight: '600', fontSize: '13px' }}>Financing Estimate</div>
          
          {/* Pricing Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {/* Sticker Price */}
            <div>
              <div style={{ color: 'var(--muted-foreground)', fontSize: '11px', marginBottom: '4px' }}>Dealer Sticker</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--foreground)' }}>
                ${Math.round(financing.dealerPrice).toLocaleString()}
              </div>
            </div>

            {/* APR */}
            <div>
              <div style={{ color: 'var(--muted-foreground)', fontSize: '11px', marginBottom: '4px' }}>Est. APR</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: financing.apr <= 7.5 ? '#10b981' : financing.apr <= 13 ? '#f59e0b' : '#ef4444' }}>
                {financing.apr.toFixed(1)}%
              </div>
            </div>

            {/* Down Payment */}
            <div>
              <div style={{ color: 'var(--muted-foreground)', fontSize: '11px', marginBottom: '4px' }}>Down Payment (15%)</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--foreground)' }}>
                ${Math.round(financing.downPayment).toLocaleString()}
              </div>
            </div>

            {/* Approval Status */}
            <div>
              <div style={{ color: 'var(--muted-foreground)', fontSize: '11px', marginBottom: '4px' }}>Approval Status</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--foreground)' }}>
                {financing.approvalStatus}
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div style={{ 
            padding: '12px', 
            backgroundColor: 'var(--background)', 
            borderRadius: '6px',
            marginBottom: '16px',
            borderLeft: '3px solid var(--accent)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ color: 'var(--muted-foreground)', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>Monthly Payment</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent)' }}>
                  ${Math.round(financing.monthlyPayment).toLocaleString()}/mo
                </div>
                <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', marginTop: '2px' }}>60 months</div>
              </div>

              <div>
                <div style={{ color: 'var(--muted-foreground)', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>True Total Cost</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--foreground)' }}>
                  ${Math.round(financing.totalDealerCost).toLocaleString()}
                </div>
                <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '2px' }}>
                  +${Math.round(financing.interestPaid).toLocaleString()} interest
                </div>
              </div>
            </div>
          </div>

          {/* Microcopy */}
          <div style={{ 
            fontSize: '11px', 
            color: 'var(--muted-foreground)', 
            fontStyle: 'italic',
            paddingTop: '12px',
            borderTop: '1px solid var(--border)'
          }}>
            Monthly and total cost are estimated based on your credit profile. Rates vary by lender.
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col gap-3 p-4">
        {/* Title */}
        <div>
          <h3 className="font-bold text-base" style={{ color: 'var(--foreground)' }}>
            {car.year} {car.make} {car.model}
          </h3>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {car.trim}
          </p>
        </div>

        {/* Primary Price */}
        <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>
            Monthly Payment
          </p>
          <p className="price-text" style={{ color: 'var(--foreground)' }}>
            ${car.monthlyPayment}
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p style={{ color: 'var(--muted-foreground)' }}>Down</p>
            <p className="font-semibold">${car.downPayment.toLocaleString()}</p>
          </div>
          <div>
            <p style={{ color: 'var(--muted-foreground)' }}>Mileage</p>
            <p className="font-semibold">{car.mileage.toLocaleString()} mi</p>
          </div>
          <div>
            <p style={{ color: 'var(--muted-foreground)' }}>Location</p>
            <p className="font-semibold text-xs">{car.location}</p>
          </div>
          <div>
            <p style={{ color: 'var(--muted-foreground)' }}>Condition</p>
            <p className="font-semibold capitalize">{car.condition}</p>
          </div>
        </div>

        {/* Explanation */}
        <p className="text-xs italic flex-1 mt-2" style={{ color: 'var(--muted-foreground)' }}>
          {car.explanation}
        </p>

        {/* Availability */}
        <div className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
          ✓ {car.availability}
        </div>
      </div>

      {/* Controls */}
      <div className="border-t p-3 flex gap-2" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={onPass}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded border hover:opacity-75 transition-opacity text-sm font-medium"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
        >
          <ThumbsDown size={14} />
          Pass
        </button>
        <button
          onClick={() => onPick(car)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded hover:opacity-90 transition-opacity text-sm font-medium"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}
        >
          <ThumbsUp size={14} />
          Pick
        </button>
      </div>
    </div>
  );
}
