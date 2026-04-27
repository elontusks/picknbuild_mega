'use client';

import { useEffect, useMemo, useState } from 'react';
import type { BestFitPreference, PathKind, PathQuote } from '@/contracts';
import { UserProfile } from '@/lib/search-demo/types';
// Import the core function directly from @/lib/pricing/* instead of the
// @/services/team-11-intelligence barrel: the barrel re-exports server-only
// listings code from team-03-supply, which would taint this client component
// and break `next build`. The core recommendBestPath has no runtime deps.
import {
  recommendBestPath,
  type RecommendationOutput,
} from '@/lib/pricing/recommendation';

interface YourBestPathRightNowProps {
  userProfile: UserProfile;
  onSeeAvailableCars?: () => void;
  onPlanForGoal?: () => void;
}

const PATH_LABEL: Record<PathKind, string> = {
  dealer: 'Dealer',
  picknbuild: 'Pick & Build',
  auction: 'Auction',
  private: 'Private Seller',
};

const PATH_TAGLINE: Record<PathKind, string> = {
  dealer: 'Fast approval, but interest stacks up over time.',
  picknbuild: 'No credit required, ~35% down, takes 30–90 days.',
  auction: 'Cheapest entry price, but unknown condition + DIY effort.',
  private: 'Negotiate direct, but you own all inspection + risk.',
};

/**
 * Build a representative set of PathQuotes from the user's profile, then
 * mutate them based on which priorities were selected. The Team 11
 * recommender picks the winner from the resulting pool — same engine the
 * Decision panel uses, just fed a synthesized listing-agnostic quote set.
 */
function buildQuotesForProfile(
  profile: UserProfile,
  priorities: string[],
): { quotes: PathQuote[]; bestFit: BestFitPreference } {
  const has = (id: string) => priorities.includes(id);
  const basePrice = 25000;
  const dealerApr = profile.creditScore && profile.creditScore < 650 ? 0.18 : 0.085;
  const term = '4y' as const;
  const months = 48;

  // Dealer: financed at base price, with credit-tier APR + 10% down.
  const dealerDown = Math.round(basePrice * 0.1);
  const dealerInterest = (basePrice - dealerDown) * dealerApr * 4;
  const dealerTotal = Math.round(basePrice + dealerInterest);
  const dealerMonthly = Math.round((basePrice - dealerDown + dealerInterest) / months);

  // Pick & Build: market avg minus condition discount, 35% down, biweekly.
  const pnbBase = Math.round(basePrice * 0.95);
  const pnbDown = Math.round(pnbBase * 0.35);
  const pnbBiweekly = Math.round((pnbBase - pnbDown) / (4 * 26));

  // Auction: cheapest sticker but add 15% repairs/transport overhead.
  const auctionBid = Math.round(basePrice * 0.7);
  const auctionTotal = Math.round(auctionBid * 1.15 + 500);

  // Private seller: negotiated cash price + 8% misc cost (transfer/inspection).
  const privateTotal = Math.round(basePrice * 0.85 * 1.08);

  let quotes: PathQuote[] = [
    {
      path: 'dealer',
      total: dealerTotal,
      down: dealerDown,
      monthly: dealerMonthly,
      apr: dealerApr,
      term,
      approvedBool: !(profile.creditScore && profile.creditScore < 580),
      barrierLine: 'Approval, credit, and down payment required.',
      titleStatus: 'clean',
    },
    {
      path: 'picknbuild',
      total: pnbBase,
      down: pnbDown,
      biweekly: pnbBiweekly,
      term,
      approvedBool: true,
      barrierLine: '~35% down to start the build.',
      titleStatus: 'clean',
    },
    {
      path: 'auction',
      total: auctionTotal,
      approvedBool: true,
      barrierLine: 'Cash up front + repairs + transport.',
      titleStatus: 'clean',
    },
    {
      path: 'private',
      total: privateTotal,
      approvedBool: true,
      barrierLine: 'Full cash, you handle inspection.',
      titleStatus: 'clean',
    },
  ];

  // Priority modifiers: bump totals or flip approvedBool to nudge the
  // recommender toward the path that fits the user's stated values.
  if (has('no-credit') || profile.hasNoCredit) {
    quotes = quotes.map((q) =>
      q.path === 'dealer' ? { ...q, approvedBool: false } : q,
    );
  }
  if (has('fast')) {
    // Fast = same-day. Auction + Pick & Build take time -> penalize totals.
    quotes = quotes.map((q) => {
      if (q.path === 'auction') return { ...q, total: Math.round(q.total * 1.5) };
      if (q.path === 'picknbuild') return { ...q, total: Math.round(q.total * 1.2) };
      return q;
    });
  }
  if (has('low-risk')) {
    // Low risk = inspected/protected. Auction is the risky one; private has no
    // platform protection. Bump those totals to reflect risk premium.
    quotes = quotes.map((q) => {
      if (q.path === 'auction') return { ...q, total: Math.round(q.total * 1.4) };
      if (q.path === 'private') return { ...q, total: Math.round(q.total * 1.15) };
      return q;
    });
  }
  if (has('hands-off')) {
    // Hands-off = no DIY. Auction + private require effort.
    quotes = quotes.map((q) => {
      if (q.path === 'auction') return { ...q, total: Math.round(q.total * 1.3) };
      if (q.path === 'private') return { ...q, total: Math.round(q.total * 1.2) };
      return q;
    });
  }

  // bestFit: lowest-cost users care about total; everyone else cares about
  // monthly cash flow. (recommendBestPath uses lowestTotal by default.)
  const bestFit: BestFitPreference = has('lowest-cost')
    ? 'lowestTotal'
    : 'lowestMonthly';

  return { quotes, bestFit };
}

export default function YourBestPathRightNow({
  userProfile,
  onSeeAvailableCars,
  onPlanForGoal,
}: YourBestPathRightNowProps) {
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [output, setOutput] = useState<RecommendationOutput | null>(null);
  const [loading, setLoading] = useState(false);

  const priorities = [
    { id: 'fast', label: 'Fast', icon: '⚡' },
    { id: 'lowest-cost', label: 'Lowest Cost', icon: '💰' },
    { id: 'low-risk', label: 'Low Risk', icon: '🛡️' },
    { id: 'hands-off', label: 'Hands-Off', icon: '👋' },
    { id: 'no-credit', label: 'No Credit Required', icon: '✓' },
  ];

  const togglePriority = (id: string) => {
    setSelectedPriorities((prev) => {
      if (prev.includes(id)) {
        return prev.filter((p) => p !== id);
      }
      if (prev.length < 2) {
        return [...prev, id];
      }
      return prev;
    });
  };

  const intake = useMemo(
    () => ({
      location: { zip: '00000' },
      cash: userProfile.availableCash,
      creditScore: userProfile.creditScore,
      noCredit: Boolean(userProfile.hasNoCredit),
      titlePreference:
        userProfile.titleType === 'clean' || userProfile.titleType === 'rebuilt'
          ? userProfile.titleType
          : ('both' as const),
      matchMode: userProfile.matchModeEnabled,
    }),
    [
      userProfile.availableCash,
      userProfile.creditScore,
      userProfile.hasNoCredit,
      userProfile.titleType,
      userProfile.matchModeEnabled,
    ],
  );

  useEffect(() => {
    if (selectedPriorities.length === 0) {
      setOutput(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { quotes, bestFit } = buildQuotesForProfile(
        userProfile,
        selectedPriorities,
      );
      setOutput(recommendBestPath({ intake, quotes, bestFit }));
    } catch {
      setOutput(null);
    } finally {
      setLoading(false);
    }
  }, [selectedPriorities, userProfile, intake]);

  const showCTAs = selectedPriorities.length === 2;

  const bestPathLine = (() => {
    if (selectedPriorities.length === 0) return null;
    if (loading) return 'Calculating your best path…';
    if (!output) return 'Pick more priorities to see a recommendation.';
    return `${PATH_LABEL[output.recommendedPath]} — ${PATH_TAGLINE[output.recommendedPath]}`;
  })();

  return (
    <div style={{ marginBottom: "24px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px", color: "var(--foreground)" }}>
        What Matters Most? (Choose up to 2)
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "16px" }}>
        {priorities.map((priority) => {
          const isSelected = selectedPriorities.includes(priority.id);
          const shouldGlow = selectedPriorities.length < 2;

          return (
            <button
              key={priority.id}
              onClick={() => togglePriority(priority.id)}
              style={{
                padding: "12px 14px",
                borderRadius: "8px",
                border: isSelected ? "2px solid var(--accent)" : "1px solid var(--border)",
                backgroundColor: isSelected ? "var(--accent)" : "var(--background)",
                color: isSelected ? "white" : "var(--foreground)",
                cursor: "pointer",
                fontWeight: isSelected ? "700" : "600",
                fontSize: "13px",
                transition: "all 150ms ease-out",
                boxShadow: shouldGlow && !isSelected ? "0 0 12px rgba(220, 38, 38, 0.3)" : isSelected ? "0 0 8px rgba(220, 38, 38, 0.4)" : "none",
                animation: shouldGlow && !isSelected ? "pulse 2s infinite" : "none",
              }}
            >
              <div>{priority.label}</div>
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 12px rgba(220, 38, 38, 0.3); }
          50% { box-shadow: 0 0 20px rgba(220, 38, 38, 0.5); }
        }
      `}</style>

      {bestPathLine && (
        <div
          style={{
            padding: "12px 14px",
            backgroundColor: "rgba(220, 38, 38, 0.08)",
            borderLeft: "3px solid var(--accent)",
            borderRadius: "4px",
            marginBottom: "16px",
            fontSize: "13px",
            fontWeight: "600",
            color: "var(--foreground)",
            animation: "fadeIn 300ms ease-out",
          }}
        >
          Best match based on your priorities: <strong>{bestPathLine}</strong>
          {output?.reason && (
            <div style={{ fontWeight: 400, fontSize: '12px', marginTop: '6px', color: 'var(--muted-foreground)' }}>
              {output.reason}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {showCTAs && (
        <div
          style={{
            display: "flex",
            gap: "12px",
            animation: "fadeIn 300ms ease-out",
          }}
        >
          <button
            onClick={() => {
              if (onSeeAvailableCars) onSeeAvailableCars();
            }}
            style={{
              flex: 1,
              padding: "12px 16px",
              backgroundColor: "var(--accent)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontWeight: "600",
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 150ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(220, 38, 38, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            See Cars You Can Get Today
          </button>
          <button
            onClick={() => {
              if (onPlanForGoal) onPlanForGoal();
            }}
            style={{
              flex: 1,
              padding: "12px 16px",
              backgroundColor: "transparent",
              color: "var(--accent)",
              border: "1px solid var(--accent)",
              borderRadius: "6px",
              fontWeight: "600",
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 150ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(220, 38, 38, 0.1)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Plan for Your Goal
          </button>
        </div>
      )}
    </div>
  );
}
