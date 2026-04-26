'use client';

import { GarageGroup, PickedCar } from '@/lib/search-demo/types';
import { Trash2 } from 'lucide-react';
import PicknbuildBrand from '@/components/PicknbuildBrand';

interface GarageProps {
  groups: GarageGroup[];
  onRemove: (carId: string) => void;
  onSelectCar: (car: PickedCar) => void;
  onCompareClick?: () => void;
}

export default function Garage({ groups, onRemove, onSelectCar, onCompareClick }: GarageProps) {
  if (groups.length === 0) {
    return (
      <div className="p-6 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
        <p>No cars picked yet.</p>
        <p className="text-xs mt-2">Pick cars from any path to compare them here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 border-b px-6 py-4" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
        <h2 className="font-bold" style={{ color: 'var(--foreground)' }}>
          My Garage
        </h2>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {groups.length} model group{groups.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {groups.map(group => (
          <div key={group.groupKey} className="border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
            <div className="border-b px-6 py-3" style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)' }}>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                {group.year} {group.make} {group.model}
              </h3>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {group.cars.length} option{group.cars.length === 1 ? '' : 's'}
              </p>
            </div>

            <div className="space-y-2 p-4">
              {group.cars.map(car => (
                <div
                  key={car.id}
                  className="flex items-start gap-3 p-3 rounded border hover:opacity-75 cursor-pointer transition-opacity"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
                  onClick={() => onSelectCar(car)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--muted)', color: 'var(--accent)' }}>
                        {car.path === 'dealer' && 'DEALER'}
                        {car.path === 'auction' && 'AUCTION'}
                        {car.path === 'picknbuild' && <PicknbuildBrand fontSize="12px" />}
                        {car.path === 'individual' && 'INDIVIDUAL'}
                      </p>
                    </div>
                    <p className="text-sm font-semibold mt-1" style={{ color: 'var(--foreground)' }}>
                      ${car.monthlyPayment}/mo
                    </p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      Down: ${car.downPayment.toLocaleString()}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      Total: ${car.totalCost.toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onRemove(car.id);
                    }}
                    className="p-2 rounded hover:opacity-70 transition-opacity text-red-600 dark:text-red-400"
                    aria-label="Remove car"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 border-t p-4" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
        <button
          onClick={onCompareClick}
          style={{ width: '100%', paddingTop: '8px', paddingBottom: '8px', paddingLeft: '16px', paddingRight: '16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer', opacity: 1, transition: 'opacity 200ms' }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Compare All Options
        </button>
      </div>
    </div>
  );
}
