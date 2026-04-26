'use client';

import { X } from 'lucide-react';
import Link from 'next/link';

interface SellYourCarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SellYourCarModal({ isOpen, onClose }: SellYourCarModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ backgroundColor: 'var(--card)', borderRadius: '12px', maxWidth: '600px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Sell Your Car</h2>
            <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', margin: '4px 0 0 0' }}>Choose your option</p>
          </div>
          <button onClick={onClose} style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--foreground)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '24px' }}>
          <Link href="/seller/listings?type=individual" style={{ textDecoration: 'none' }} onClick={onClose}>
            <div style={{ padding: '24px 16px', borderRadius: '8px', border: '2px solid var(--border)', backgroundColor: 'var(--background)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start', transition: 'all 200ms' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'var(--muted)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.backgroundColor = 'var(--background)'; }}
            >
              <div style={{ fontSize: '24px' }}>👤</div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Individual</h3>
                <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '4px 0 0 0' }}>Sell your personal vehicle</p>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontWeight: '500', marginTop: '8px' }}>
                <p style={{ margin: 0 }}>✓ 1 free listing</p>
                <p style={{ margin: '4px 0 0 0' }}>✓ $5 per additional</p>
              </div>
            </div>
          </Link>

          <Link href="/seller/claim" style={{ textDecoration: 'none' }} onClick={onClose}>
            <div style={{ padding: '24px 16px', borderRadius: '8px', border: '2px solid var(--border)', backgroundColor: 'var(--background)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start', transition: 'all 200ms' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'var(--muted)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.backgroundColor = 'var(--background)'; }}
            >
              <div style={{ fontSize: '24px' }}>🏢</div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Dealer</h3>
                <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '4px 0 0 0' }}>Professional dealership</p>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontWeight: '500', marginTop: '8px' }}>
                <p style={{ margin: 0 }}>✓ 10 free listings</p>
                <p style={{ margin: '4px 0 0 0' }}>✓ Lead management</p>
              </div>
            </div>
          </Link>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 24px 24px 24px' }}>
          <button onClick={onClose} style={{ padding: '10px 16px', borderRadius: '6px', backgroundColor: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 200ms' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--border)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)'; }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
