'use client';

import { UserProfile } from '@/lib/search-demo/types';
import { X } from 'lucide-react';

interface PlanningPanelProps {
  userProfile: UserProfile;
  onClose: () => void;
}

export default function PlanningPanel({ userProfile, onClose }: PlanningPanelProps) {
  const availableCash = userProfile.availableCash || 0;
  const creditScore = userProfile.creditScore || 0;
  const hasCredit = creditScore > 0;
  
  // Realistic price ranges by path
  const dealerRange = { min: 15000, max: 35000 };
  const auctionRange = { min: 8000, max: 25000 };
  const picknbuildRange = { min: 12000, max: 30000 };
  const privateRange = { min: 5000, max: 20000 };

  // Determine what the user can realistically get today
  const canGetTodayMinimum = Math.min(
    hasCredit ? dealerRange.min : picknbuildRange.min,
    auctionRange.min,
    privateRange.min
  );

  const canAffordToday = availableCash >= 5000;
  
  // Realistic target (what they should aim for)
  const targetPrice = 25000;
  const totalGap = Math.max(0, targetPrice - availableCash);
  
  // Recommended next steps
  const getNextSteps = () => {
    const steps = [];
    
    if (!canAffordToday) {
      steps.push({
        priority: 1,
        action: 'Build up savings',
        detail: `You need about $${(5000 - availableCash).toLocaleString()} more for initial down payment`,
        timeframe: '1-3 months',
      });
    }

    if (!hasCredit || creditScore < 620) {
      steps.push({
        priority: 2,
        action: 'Improve credit score',
        detail: 'Consider Pick & Build path which does not require traditional credit',
        timeframe: 'Start now',
      });
    }

    if (totalGap > 0) {
      steps.push({
        priority: 3,
        action: 'Save for target vehicle',
        detail: `Gap between available cash and target: $${totalGap.toLocaleString()}`,
        timeframe: `${Math.ceil(totalGap / 500)} months at $500/month`,
      });
    }

    if (steps.length === 0) {
      steps.push({
        priority: 1,
        action: 'You are ready',
        detail: 'Your current situation qualifies for multiple paths',
        timeframe: 'Start shopping now',
      });
    }

    return steps;
  };

  const nextSteps = getNextSteps();

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '420px',
        backgroundColor: 'var(--background)',
        borderLeft: `1px solid var(--border)`,
        boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.1)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideInRight 300ms ease-out',
      }}
    >
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          padding: '24px',
          borderBottom: `1px solid var(--border)`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
          Your Plan
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--muted-foreground)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Current Situation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: 'var(--muted-foreground)' }}>
            YOUR CURRENT SITUATION
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
            }}
          >
            <div style={{ padding: '12px', backgroundColor: 'var(--muted)', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Available Cash</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--foreground)' }}>
                ${availableCash.toLocaleString()}
              </div>
            </div>
            <div style={{ padding: '12px', backgroundColor: 'var(--muted)', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Credit Score</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--foreground)' }}>
                {hasCredit ? creditScore : 'No Credit'}
              </div>
            </div>
          </div>
        </div>

        {/* What You Can Get Today */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: 'var(--muted-foreground)' }}>
            REALISTIC OPTIONS TODAY
          </h3>
          <div
            style={{
              padding: '12px',
              backgroundColor: '#fef3c7',
              borderRadius: '6px',
              borderLeft: '3px solid #f59e0b',
            }}
          >
            <div style={{ fontSize: '12px', color: '#92400e', lineHeight: '1.6' }}>
              {canAffordToday ? (
                <>
                  With ${availableCash.toLocaleString()} available, you can realistically pursue:
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <strong>Pick & Build</strong><br/>
                      <span style={{ fontSize: '11px', color: '#78350f', display: 'block', marginTop: '2px', lineHeight: '1.3' }}>
                        • Requires ~35% down<br/>
                        • No bank needed<br/>
                        • We handle everything
                      </span>
                    </div>
                    {hasCredit && (
                      <div>
                        <strong>Dealer</strong><br/>
                        <span style={{ fontSize: '11px', color: '#78350f', display: 'block', marginTop: '2px', lineHeight: '1.3' }}>
                          • Requires good credit (usually)<br/>
                          • High interest over time<br/>
                          • Fastest way to get a car
                        </span>
                      </div>
                    )}
                    {availableCash >= 10000 && (
                      <div>
                        <strong>Auction (DIY)</strong><br/>
                        <span style={{ fontSize: '11px', color: '#78350f', display: 'block', marginTop: '2px', lineHeight: '1.3' }}>
                          • Lowest prices<br/>
                          • You fix/manage everything<br/>
                          • Higher risk if unsure
                        </span>
                      </div>
                    )}
                    <div>
                      <strong>Private Seller</strong><br/>
                      <span style={{ fontSize: '11px', color: '#78350f', display: 'block', marginTop: '2px', lineHeight: '1.3' }}>
                          • Cash required upfront<br/>
                          • You handle inspection<br/>
                          • Risk depends on seller
                        </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  You need ${(5000 - availableCash).toLocaleString()} more to start shopping. In the meantime:
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div>• Save aggressively toward $5,000 minimum</div>
                    <div>• Improve credit score if needed</div>
                    <div>• Research which path fits your priorities best</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Your Goal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: 'var(--muted-foreground)' }}>
            REACHING YOUR GOAL
          </h3>
          <div style={{ padding: '12px', backgroundColor: 'var(--muted)', borderRadius: '6px' }}>
            <div style={{ fontSize: '12px', color: 'var(--foreground)', marginBottom: '8px' }}>
              Target vehicle price: <strong>${targetPrice.toLocaleString()}</strong>
            </div>
            {totalGap > 0 && (
              <div style={{ fontSize: '12px', color: '#ef4444' }}>
                Gap to close: <strong>${totalGap.toLocaleString()}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Next Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: 'var(--muted-foreground)' }}>
            RECOMMENDED NEXT STEPS
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {nextSteps.map((step) => (
              <div
                key={step.priority}
                style={{
                  padding: '12px',
                  backgroundColor: 'var(--muted)',
                  borderRadius: '6px',
                  borderLeft: '3px solid var(--accent)',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '4px' }}>
                  {step.priority}. {step.action}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '4px' }}>
                  {step.detail}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
                  {step.timeframe}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
