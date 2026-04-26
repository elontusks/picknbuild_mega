'use client';

import { Car } from '@/lib/search-demo/types';
import { X } from 'lucide-react';

interface DetailPanelProps {
  car: Car;
  onClose: () => void;
  onPick: (car: Car) => void;
}

export default function DetailPanel({ car, onClose, onPick }: DetailPanelProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="w-full max-w-2xl rounded-t-lg max-h-96 overflow-y-auto" style={{ backgroundColor: 'var(--background)' }}>
        <div className="flex items-center justify-between sticky top-0 border-b px-6 py-4" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
          <h2 className="font-bold" style={{ color: 'var(--foreground)' }}>
            {car.year} {car.make} {car.model}
          </h2>
          <button onClick={onClose} className="p-2 rounded hover:opacity-75 transition-opacity" style={{ color: 'var(--foreground)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-3 gap-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
              Pricing Breakdown
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted-foreground)' }}>Down Payment</span>
                <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  ${car.downPayment.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted-foreground)' }}>Monthly</span>
                <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  ${car.monthlyPayment}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted-foreground)' }}>Fees</span>
                <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  ${car.fees}
                </span>
              </div>
              {car.repairEstimate && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--muted-foreground)' }}>Est. Repairs</span>
                  <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                    ${car.repairEstimate.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                <span>Total Cost</span>
                <span>${car.totalCost.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
              Details
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Mileage
                </p>
                <p className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  {car.mileage.toLocaleString()} mi
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Condition
                </p>
                <p className="font-semibold capitalize" style={{ color: 'var(--foreground)' }}>
                  {car.condition}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Availability
                </p>
                <p className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  {car.availability}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Effort Level
                </p>
                <p className="font-semibold capitalize" style={{ color: 'var(--foreground)' }}>
                  {car.effort}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Risk Level
                </p>
                <p className="font-semibold capitalize" style={{ color: 'var(--foreground)' }}>
                  {car.risk}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
              Why This Works
            </h3>
            <p className="text-sm italic" style={{ color: 'var(--muted-foreground)' }}>
              {car.explanation}
            </p>
            <button
              onClick={() => {
                onPick(car);
                onClose();
              }}
              className="w-full mt-4 py-2 px-4 rounded-lg text-sm font-medium hover:opacity-90 transition"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              Add to Garage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
