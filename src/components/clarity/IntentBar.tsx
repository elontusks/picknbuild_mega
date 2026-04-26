'use client';

import { useState } from 'react';
import { MapPin, Calendar } from 'lucide-react';

interface IntentBarProps {
  onLocationChange?: (location: string) => void;
  onDateChange?: (date: string) => void;
}

export default function IntentBar({ onLocationChange, onDateChange }: IntentBarProps) {
  const [location, setLocation] = useState('');
  const [needByDate, setNeedByDate] = useState('');

  const handleLocationChange = (value: string) => {
    setLocation(value);
    onLocationChange?.(value);
  };

  const handleDateChange = (value: string) => {
    setNeedByDate(value);
    onDateChange?.(value);
  };

  const handleUseLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        // In production, this would reverse-geocode coordinates to a city name
        // For now, show a placeholder
        const location = 'Your Location';
        setLocation(location);
        onLocationChange?.(location);
      });
    }
  };

  return (
    <div style={{
      padding: '24px',
      borderBottom: '1px solid var(--border)',
      backgroundColor: 'var(--background)'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', color: 'var(--foreground)' }}>
            Let's find the right path for you
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>
            Tell us where you are and when you need a car
          </p>
        </div>

        {/* Input Grid - 2 columns for Location and Date */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          alignItems: 'flex-end'
        }}>
          {/* Location Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--muted-foreground)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Where are you located?
            </label>
            <div style={{ position: 'relative' }}>
              <MapPin
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--muted-foreground)',
                  pointerEvents: 'none'
                }}
              />
              <input
                type="text"
                placeholder="City, ZIP code, or address"
                value={location}
                onChange={(e) => handleLocationChange(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '36px',
                  paddingRight: '12px',
                  paddingTop: '10px',
                  paddingBottom: '10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.backgroundColor = 'var(--card)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.backgroundColor = 'var(--background)';
                }}
              />
            </div>
            <button
              onClick={handleUseLocation}
              style={{
                fontSize: '11px',
                color: 'var(--accent)',
                fontWeight: '500',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: '4px 0',
                textAlign: 'left',
                transition: 'opacity 200ms'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Use my location
            </button>
          </div>

          {/* Need By Date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--muted-foreground)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              When do you need the car?
            </label>
            <div style={{ position: 'relative' }}>
              <Calendar
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--muted-foreground)',
                  pointerEvents: 'none'
                }}
              />
              <input
                type="date"
                value={needByDate}
                onChange={(e) => handleDateChange(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '36px',
                  paddingRight: '12px',
                  paddingTop: '10px',
                  paddingBottom: '10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.backgroundColor = 'var(--card)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.backgroundColor = 'var(--background)';
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
