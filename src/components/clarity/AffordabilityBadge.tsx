import { AffordabilityState, CreditTier } from '@/lib/search-demo/types';
import { getCreditColor } from '@/lib/search-demo/matchModeUtils';

interface AffordabilityBadgeProps {
  state: AffordabilityState;
  creditTier: CreditTier;
  showCredit?: boolean;
}

export default function AffordabilityBadge({ state, creditTier, showCredit = false }: AffordabilityBadgeProps) {
  const badgeColor = state.canAfford ? '#10b981' : '#ef4444';
  const badgeText = state.canAfford ? 'Can afford now' : 'Not enough cash';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '6px', backgroundColor: `${badgeColor}20`, border: `1px solid ${badgeColor}` }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: badgeColor }}></div>
        <span style={{ fontSize: '12px', fontWeight: '600', color: badgeColor }}>{badgeText}</span>
      </div>

      <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', lineHeight: '1.4' }}>
        {state.reason}
      </div>

      {!state.canAfford && state.shortBy && (
        <div style={{ fontSize: '11px', padding: '8px', backgroundColor: 'var(--muted)', borderRadius: '4px', color: 'var(--muted-foreground)' }}>
          Short by: ${state.shortBy.toLocaleString()}
        </div>
      )}

      {showCredit && creditTier !== 'green' && (
        <div style={{ fontSize: '11px', padding: '6px 8px', backgroundColor: `${getCreditColor(creditTier)}20`, borderRadius: '4px', color: getCreditColor(creditTier), fontWeight: '500' }}>
          ⓘ Credit tier affects approval and rates
        </div>
      )}
    </div>
  );
}
