'use client';

import { useState } from 'react';
import { UserProfile } from '@/lib/search-demo/types';

interface YourBestPathRightNowProps {
  userProfile: UserProfile;
  onSeeAvailableCars?: () => void;
  onPlanForGoal?: () => void;
}

export default function YourBestPathRightNow({
  userProfile,
  onSeeAvailableCars,
  onPlanForGoal,
}: YourBestPathRightNowProps) {
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);

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

  const getBestPath = (): string | null => {
    if (selectedPriorities.length === 0) return null;

    const has = (id: string) => selectedPriorities.includes(id);

    if (selectedPriorities.length === 1) {
      const priority = selectedPriorities[0];
      if (priority === "fast") return "Dealer — Fastest option (same day), but high interest and needs credit";
      if (priority === "lowest-cost") return "Auction — Lowest price, but unknown condition, work required, takes time";
      if (priority === "low-risk") return "Dealer — Fast approval with lower risk, but higher total cost over time";
      if (priority === "hands-off") return "Pick & Build — No credit required, ~35% down, takes 30–90 days";
      if (priority === "no-credit") return "Pick & Build — No credit required, ~35% down, takes 30–90 days";
    }

    if (selectedPriorities.length === 2) {
      if (has("fast") && has("hands-off")) return "Dealer — Fast approval (same day), but pay more over time or Pick & Build";
      if (has("lowest-cost") && has("fast")) return "Auction — Low price, but unknown condition and you handle everything";
      if (has("no-credit") && has("hands-off")) return "Pick & Build — No credit required, ~35% down, takes 30–90 days";
      if (has("lowest-cost") && has("low-risk")) return "Private Seller — Lower price with cash, but unknown seller and no protection";
      if (has("fast") && has("low-risk")) return "Dealer — Fast approval with lower risk, but higher cost over time";
      if (has("lowest-cost") && has("hands-off")) return "Auction — Cheapest option, but unknown condition and you handle everything";
      if (has("no-credit") && has("lowest-cost")) return "Auction — Lowest price without credit needed, but unknown condition, high effort";
      if (has("fast") && has("no-credit")) return "Pick & Build — No credit required, takes time but handles everything for you";
      return "Pick & Build — No credit required, ~35% down, takes 30–90 days";
    }

    return null;
  };

  const bestPath = getBestPath();
  const showCTAs = selectedPriorities.length === 2;

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

      {selectedPriorities.length >= 1 && bestPath && (
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
          Best match based on your priorities: <strong>{bestPath}</strong>
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
