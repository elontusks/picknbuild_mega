'use client';

import { ReactNode } from 'react';

interface SponsorAreaProps {
  title: ReactNode;
  description: string;
  variant?: 'dealer' | 'auction' | 'individual' | 'picknbuild';
}

export default function SponsorArea({ title, description, variant = 'dealer' }: SponsorAreaProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'dealer':
        return {
          bg: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
        };
      case 'auction':
        return {
          bg: 'rgba(100, 116, 139, 0.05)',
          border: '1px solid rgba(100, 116, 139, 0.2)',
        };
      case 'individual':
        return {
          bg: 'rgba(168, 85, 247, 0.05)',
          border: '1px solid rgba(168, 85, 247, 0.2)',
        };
      case 'picknbuild':
        return {
          bg: 'rgba(0, 204, 153, 0.05)',
          border: '1px solid rgba(0, 204, 153, 0.2)',
        };
      default:
        return {
          bg: 'rgba(0, 0, 0, 0.02)',
          border: '1px solid var(--border)',
        };
    }
  };

  const styles = getVariantStyles();

  const mockSponsors = [
    { name: 'WarrantyPlus', color: '#3B82F6' },
    { name: 'InsureAuto', color: '#10B981' },
    { name: 'MaintenancePro', color: '#F59E0B' },
  ];

  return (
    <div
      style={{
        padding: '12px',
        backgroundColor: styles.bg,
        border: styles.border,
        borderRadius: '8px',
        marginTop: '12px',
      }}
    >
      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', marginBottom: '6px' }}>
        {title}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--foreground)', marginBottom: '4px', lineHeight: '1.4' }}>
        {description}
      </div>
      
      {/* Mock Sponsors Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px' }}>
        {mockSponsors.map((sponsor) => (
          <div
            key={sponsor.name}
            style={{
              padding: '8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.4)',
              border: `1px solid ${sponsor.color}33`,
              cursor: 'pointer',
              transition: 'all 150ms',
              textAlign: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${sponsor.color}15`;
              e.currentTarget.style.borderColor = `${sponsor.color}66`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
              e.currentTarget.style.borderColor = `${sponsor.color}33`;
            }}
          >
            <div style={{ fontSize: '7px', fontWeight: '700', color: sponsor.color, letterSpacing: '0.5px' }}>
              ●
            </div>
            <div style={{ fontSize: '9px', fontWeight: '600', color: 'var(--foreground)', marginTop: '2px' }}>
              {sponsor.name}
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontStyle: 'italic', marginTop: '8px' }}>
        Businesses can place services here
      </div>
    </div>
  );
}
