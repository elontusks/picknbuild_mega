'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, LogOut } from 'lucide-react';

interface AccountMenuProps {
  user: {
    email: string;
    name?: string;
  };
  onSignOut: () => void;
  onGarageClick?: () => void;
}

export default function AccountMenu({ user, onSignOut, onGarageClick }: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = () => {
    const email = user.email || '';
    const firstLetter = email.charAt(0).toUpperCase();
    return firstLetter;
  };

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '8px',
          backgroundColor: 'var(--accent)',
          color: 'var(--accent-foreground)',
          border: 'none',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: '600',
          transition: 'all 200ms'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        {/* Initials Avatar */}
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: '700'
        }}>
          {getInitials()}
        </div>
        <ChevronDown size={16} style={{ opacity: 0.7 }} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '8px',
          backgroundColor: 'var(--background)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          minWidth: '200px',
          zIndex: 50,
          overflow: 'hidden'
        }}>
          {/* User Info */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--foreground)' }}>
              Account
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
              {user.email}
            </div>
          </div>

          {/* Menu Items */}
          <div style={{ padding: '8px 0' }}>
            {[
              { label: 'Garage', onClick: onGarageClick },
              { label: 'My Listings', onClick: () => console.log('[v0] My Listings clicked') },
              { label: 'Referrals', onClick: () => console.log('[v0] Referrals clicked') },
              { label: 'Settings', onClick: () => console.log('[v0] Settings clicked') }
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  item.onClick?.();
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--foreground)',
                  fontSize: '13px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 200ms'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--muted)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: 'var(--border)' }} />

          {/* Sign Out */}
          <button
            onClick={() => {
              onSignOut();
              setIsOpen(false);
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--foreground)',
              fontSize: '13px',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 200ms'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--muted)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
