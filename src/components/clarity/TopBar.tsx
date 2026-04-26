'use client';

import { Menu } from 'lucide-react';
import AccountMenu from './AccountMenu';

interface TopBarProps {
  pickedCount: number;
  onGarageClick: () => void;
  garageOpen: boolean;
  onReferralClick?: () => void;
  onSellClick?: () => void;
  onSignInClick?: () => void;
  currentUser?: { email: string; name?: string } | null;
  onSignOut?: () => void;
}

export default function TopBar({
  pickedCount,
  onGarageClick,
  garageOpen,
  onReferralClick,
  onSellClick,
  onSignInClick,
  currentUser,
  onSignOut
}: TopBarProps) {

  return (
    <header style={{ borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 20, backgroundColor: 'var(--background)' }}>
      <div style={{ paddingLeft: '24px', paddingRight: '24px', paddingTop: '16px', paddingBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', cursor: 'pointer' }}>
            <img 
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/picknbuild%20banner-Recovered-min-iq954CW7VTLzjYxMAqY9Xw91r73j86.png"
              alt="picknbuild"
              style={{ height: '32px', width: 'auto' }}
            />
          </a>
          
          {/* Status Indicator Circles */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#22c55e' }} aria-label="green status" />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#eab308' }} aria-label="yellow status" />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }} aria-label="red status" />
          </div>
          
          <div>
            <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: 0 }}>
              Shop every way to buy a car — all at once.
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto' }}>
          {/* Careers Link */}
          <a
            href="/careers"
            style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', borderRadius: '8px', backgroundColor: 'var(--muted)', color: 'var(--foreground)', border: '1px solid var(--border)', fontWeight: '500', fontSize: '13px', cursor: 'pointer', textDecoration: 'none', display: 'inline-block', transition: 'all 200ms' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent-foreground)'; e.currentTarget.style.border = 'none'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)'; e.currentTarget.style.color = 'var(--foreground)'; e.currentTarget.style.border = '1px solid var(--border)'; }}
          >
            Careers
          </a>

          {/* Sell Your Car Button */}
          {onSellClick && (
            <button
              onClick={onSellClick}
              style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', borderRadius: '8px', backgroundColor: 'var(--muted)', color: 'var(--foreground)', border: '1px solid var(--border)', fontWeight: '500', fontSize: '13px', cursor: 'pointer', opacity: 1, transition: 'all 200ms' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent-foreground)'; e.currentTarget.style.border = 'none'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)'; e.currentTarget.style.color = 'var(--foreground)'; e.currentTarget.style.border = '1px solid var(--border)'; }}
            >
              Sell Your Car
            </button>
          )}

          {/* Invite & Earn Button */}
          {onReferralClick && (
            <button
              onClick={onReferralClick}
              style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', borderRadius: '8px', backgroundColor: 'var(--muted)', color: 'var(--foreground)', border: '1px solid var(--border)', fontWeight: '500', fontSize: '13px', cursor: 'pointer', opacity: 1, transition: 'all 200ms' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent-foreground)'; e.currentTarget.style.border = 'none'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)'; e.currentTarget.style.color = 'var(--foreground)'; e.currentTarget.style.border = '1px solid var(--border)'; }}
            >
              Invite & Earn $500
            </button>
          )}

          {/* Sign In / Account Menu */}
          {!currentUser ? (
            <button
              onClick={onSignInClick}
              style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', borderRadius: '8px', backgroundColor: 'var(--muted)', color: 'var(--foreground)', border: '1px solid var(--border)', fontWeight: '500', fontSize: '13px', cursor: 'pointer', opacity: 1, transition: 'all 200ms' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent-foreground)'; e.currentTarget.style.border = 'none'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--muted)'; e.currentTarget.style.color = 'var(--foreground)'; e.currentTarget.style.border = '1px solid var(--border)'; }}
            >
              Sign In
            </button>
          ) : (
            <AccountMenu
              user={currentUser}
              onSignOut={onSignOut || (() => {})}
              onGarageClick={onGarageClick}
            />
          )}

          <button
            onClick={onGarageClick}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '16px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', borderRadius: '8px', backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)', border: 'none', fontWeight: '500', fontSize: '14px', cursor: 'pointer', opacity: 1, transition: 'opacity 200ms' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <Menu size={18} />
            Garage
            {pickedCount > 0 && (
              <span style={{ marginLeft: '8px', paddingLeft: '8px', paddingRight: '8px', paddingTop: '4px', paddingBottom: '4px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px', backgroundColor: 'var(--accent-foreground)', color: 'var(--accent)' }}>
                {pickedCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
