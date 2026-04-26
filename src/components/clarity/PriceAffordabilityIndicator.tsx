import { AffordabilityState } from '@/lib/search-demo/types';

interface PriceAffordabilityIndicatorProps {
  totalPrice: number;
  affordability: AffordabilityState;
  label?: string;
  showLabel?: boolean;
  downPayment?: number;
  customMessage?: (affordability: AffordabilityState, downPayment?: number) => string;
}

export default function PriceAffordabilityIndicator({
  totalPrice,
  affordability,
  label = 'Total Cost',
  showLabel = true,
  downPayment,
  customMessage,
}: PriceAffordabilityIndicatorProps) {
  // Determine color: green if can afford, yellow if close (within 20%), red if not
  let backgroundColor: string;
  let borderColor: string;
  let textColor: string;

  if (affordability.canAfford) {
    // Green - can afford
    backgroundColor = 'rgba(16, 185, 129, 0.1)';
    borderColor = '#10b981';
    textColor = '#059669';
  } else if (affordability.shortBy && affordability.shortBy <= (totalPrice * 0.2)) {
    // Yellow - close but short a little (within 20%)
    backgroundColor = 'rgba(245, 158, 11, 0.1)';
    borderColor = '#f59e0b';
    textColor = '#d97706';
  } else {
    // Red - cannot afford
    backgroundColor = 'rgba(239, 68, 68, 0.1)';
    borderColor = '#ef4444';
    textColor = '#dc2626';
  }

  // Generate message
  let message = '';
  if (customMessage) {
    message = customMessage(affordability, downPayment);
  } else {
    message = affordability.canAfford ? '✓ You have the cash' : '';
    if (!affordability.canAfford && affordability.shortBy && affordability.shortBy <= (totalPrice * 0.2)) {
      message = `⚠ Short $${Math.round(affordability.shortBy).toLocaleString()}`;
    }
    if (!affordability.canAfford && (!affordability.shortBy || affordability.shortBy > (totalPrice * 0.2))) {
      message = `✗ Short $${Math.round(affordability.shortBy || 0).toLocaleString()}`;
    }
  }

  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: '8px',
        border: `2px solid ${borderColor}`,
        backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
    >
      {showLabel && (
        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </div>
      )}
      <div style={{ fontSize: '20px', fontWeight: '700', color: textColor }}>
        ${Math.round(totalPrice).toLocaleString()}
      </div>
      <div style={{ fontSize: '11px', fontWeight: '500', color: textColor, marginTop: '2px' }}>
        {message}
      </div>
    </div>
  );
}
