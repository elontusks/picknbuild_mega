'use client';

import { PickedCar } from '@/lib/search-demo/types';
import { X } from 'lucide-react';

interface ComparisonModalProps {
  pickedCars: PickedCar[];
  onClose: () => void;
}

export default function ComparisonModal({ pickedCars, onClose }: ComparisonModalProps) {
  if (pickedCars.length === 0) {
    return null;
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ backgroundColor: 'var(--background)', borderRadius: '12px', maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto', width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '24px', paddingRight: '24px', paddingTop: '20px', paddingBottom: '20px', borderBottom: `1px solid var(--border)`, position: 'sticky', top: 0, backgroundColor: 'var(--background)', zIndex: 10 }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--foreground)' }}>Compare All Options</h2>
          <button
            onClick={onClose}
            style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--foreground)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Comparison Table */}
        <div style={{ overflowX: 'auto', padding: '24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid var(--border)` }}>
                <th style={{ textAlign: 'left', paddingBottom: '12px', paddingRight: '16px', fontWeight: '600', color: 'var(--foreground)', fontSize: '14px' }}>Vehicle</th>
                <th style={{ textAlign: 'left', paddingBottom: '12px', paddingRight: '16px', fontWeight: '600', color: 'var(--foreground)', fontSize: '14px' }}>Path</th>
                <th style={{ textAlign: 'right', paddingBottom: '12px', paddingRight: '16px', fontWeight: '600', color: 'var(--foreground)', fontSize: '14px' }}>Down Payment</th>
                <th style={{ textAlign: 'right', paddingBottom: '12px', paddingRight: '16px', fontWeight: '600', color: 'var(--foreground)', fontSize: '14px' }}>Monthly</th>
                <th style={{ textAlign: 'right', paddingBottom: '12px', paddingRight: '16px', fontWeight: '600', color: 'var(--foreground)', fontSize: '14px' }}>Total Cost</th>
                <th style={{ textAlign: 'left', paddingBottom: '12px', paddingRight: '16px', fontWeight: '600', color: 'var(--foreground)', fontSize: '14px' }}>Risk</th>
                <th style={{ textAlign: 'left', paddingBottom: '12px', paddingRight: '16px', fontWeight: '600', color: 'var(--foreground)', fontSize: '14px' }}>Effort</th>
                <th style={{ textAlign: 'left', paddingBottom: '12px', paddingRight: '16px', fontWeight: '600', color: 'var(--foreground)', fontSize: '14px' }}>Condition</th>
              </tr>
            </thead>
            <tbody>
              {pickedCars.map((car, index) => {
                const isLowest = (value: number, key: string) => {
                  const values = pickedCars.map(c => (key === 'down' ? c.downPayment : key === 'monthly' ? c.monthlyPayment : c.totalCost));
                  return value === Math.min(...values);
                };

                return (
                  <tr key={car.id} style={{ borderBottom: `1px solid var(--border)`, backgroundColor: index % 2 === 0 ? 'var(--card)' : 'transparent' }}>
                    <td style={{ paddingTop: '12px', paddingBottom: '12px', paddingRight: '16px', color: 'var(--foreground)', fontSize: '14px', fontWeight: '500' }}>
                      {car.year} {car.make} {car.model}
                    </td>
                    <td style={{ paddingTop: '12px', paddingBottom: '12px', paddingRight: '16px', fontSize: '12px', fontWeight: '600', color: 'var(--accent)' }}>
                      {car.path === 'dealer' && 'DEALER'}
                      {car.path === 'auction' && 'AUCTION'}
                      {car.path === 'picknbuild' && 'PICK & BUILD'}
                      {car.path === 'individual' && 'INDIVIDUAL'}
                    </td>
                    <td style={{ paddingTop: '12px', paddingBottom: '12px', paddingRight: '16px', textAlign: 'right', color: 'var(--foreground)', fontSize: '14px', fontWeight: isLowest(car.downPayment, 'down') ? 'bold' : '500' }}>
                      ${car.downPayment.toLocaleString()}
                      {isLowest(car.downPayment, 'down') && <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--accent)' }}>✓</span>}
                    </td>
                    <td style={{ paddingTop: '12px', paddingBottom: '12px', paddingRight: '16px', textAlign: 'right', color: 'var(--foreground)', fontSize: '14px', fontWeight: isLowest(car.monthlyPayment, 'monthly') ? 'bold' : '500' }}>
                      ${car.monthlyPayment}
                      {isLowest(car.monthlyPayment, 'monthly') && <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--accent)' }}>✓</span>}
                    </td>
                    <td style={{ paddingTop: '12px', paddingBottom: '12px', paddingRight: '16px', textAlign: 'right', color: 'var(--foreground)', fontSize: '14px', fontWeight: isLowest(car.totalCost, 'total') ? 'bold' : '500' }}>
                      ${car.totalCost.toLocaleString()}
                      {isLowest(car.totalCost, 'total') && <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--accent)' }}>✓</span>}
                    </td>
                    <td style={{ paddingTop: '12px', paddingBottom: '12px', paddingRight: '16px', color: 'var(--muted-foreground)', fontSize: '14px', textTransform: 'capitalize' }}>
                      {car.risk}
                    </td>
                    <td style={{ paddingTop: '12px', paddingBottom: '12px', paddingRight: '16px', color: 'var(--muted-foreground)', fontSize: '14px', textTransform: 'capitalize' }}>
                      {car.effort}
                    </td>
                    <td style={{ paddingTop: '12px', paddingBottom: '12px', paddingRight: '16px', color: 'var(--muted-foreground)', fontSize: '14px', textTransform: 'capitalize' }}>
                      {car.condition}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div style={{ borderTop: `1px solid var(--border)`, paddingLeft: '24px', paddingRight: '24px', paddingTop: '16px', paddingBottom: '16px', backgroundColor: 'var(--card)', display: 'flex', gap: '24px', fontSize: '14px', justifyContent: 'space-around' }}>
          <div>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '12px', marginBottom: '4px' }}>Best Total Cost</p>
            <p style={{ color: 'var(--foreground)', fontWeight: 'bold' }}>
              ${Math.min(...pickedCars.map(c => c.totalCost)).toLocaleString()}
            </p>
          </div>
          <div>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '12px', marginBottom: '4px' }}>Best Monthly</p>
            <p style={{ color: 'var(--foreground)', fontWeight: 'bold' }}>
              ${Math.min(...pickedCars.map(c => c.monthlyPayment))}/mo
            </p>
          </div>
          <div>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '12px', marginBottom: '4px' }}>Lowest Risk</p>
            <p style={{ color: 'var(--foreground)', fontWeight: 'bold', textTransform: 'capitalize' }}>
              {['low', 'medium', 'high'].find(level => pickedCars.some(c => c.risk === level))}
            </p>
          </div>
          <div>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '12px', marginBottom: '4px' }}>Easiest</p>
            <p style={{ color: 'var(--foreground)', fontWeight: 'bold', textTransform: 'capitalize' }}>
              {['low', 'medium', 'high'].find(level => pickedCars.some(c => c.effort === level))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
