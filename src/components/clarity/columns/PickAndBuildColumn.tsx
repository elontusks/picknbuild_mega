'use client';

interface PickAndBuildColumnProps {
  searchQuery: string;
  onReferralClick?: () => void;
}

export default function PickAndBuildColumn({ searchQuery, onReferralClick }: PickAndBuildColumnProps) {
  const estimates = [
    { id: 1, title: 'Toyota Camry 2018', totalCost: '$6,500', monthly: '$245', down: '35%', timeline: '2-3 weeks' },
    { id: 2, title: 'Honda Accord 2019', totalCost: '$7,200', monthly: '$272', down: '35%', timeline: '2-3 weeks' },
  ];

  return (
    <div className="space-y-4 highlight-card p-5 rounded-lg">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">Pick & Build</h2>
          <span className="chip bg-accent text-accent-foreground">Premium</span>
        </div>
        <p className="subtitle-text">Done for you, optimized total cost</p>
      </div>

      {/* Description */}
      <div className="text-xs text-secondary bg-muted/50 p-3 rounded-lg">
        We handle sourcing, repairs, and delivery
      </div>

      {/* Cards */}
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {estimates.map((item) => (
          <div key={item.id} className="card-hover p-4 bg-background rounded-lg border border-accent/30 cursor-pointer">
            <div className="space-y-3">
              <div className="space-y-1">
                <h3 className="font-semibold text-sm">{item.title}</h3>
                <p className="price-text text-2xl">{item.totalCost}</p>
              </div>
              <div className="space-y-1 text-xs text-secondary">
                <p>Est. monthly: {item.monthly}</p>
                <p>Down payment: {item.down}</p>
                <p>Timeline: {item.timeline}</p>
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-accent font-medium">Complete package included</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Referral Callout */}
      {onReferralClick && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '6px',
          backgroundColor: 'var(--accent)',
          color: 'var(--accent-foreground)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: '500', lineHeight: '1.4' }}>
            Need help getting over the line?<br/>
            <span style={{ opacity: 0.9 }}>Invite a friend and earn $500 when they complete a PicknBuild deal.</span>
          </div>
          <button
            onClick={onReferralClick}
            style={{
              paddingLeft: '12px',
              paddingRight: '12px',
              paddingTop: '6px',
              paddingBottom: '6px',
              borderRadius: '4px',
              backgroundColor: 'var(--accent-foreground)',
              color: 'var(--accent)',
              border: 'none',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 200ms'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Invite a Friend
          </button>
        </div>
      )}

      {/* CTA */}
      <button className="w-full py-2 px-4 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 transition font-semibold">
        Source this car for me
      </button>
    </div>
  );
}
