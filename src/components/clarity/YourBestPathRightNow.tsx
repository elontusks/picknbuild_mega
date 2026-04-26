'use client';

import { UserProfile } from '@/lib/search-demo/types';

interface YourBestPathRightNowProps {
  userProfile: UserProfile;
  onSeeAvailableCars?: () => void;
  onPlanForGoal?: () => void;
}

export default function YourBestPathRightNow({
  userProfile: _userProfile,
  onSeeAvailableCars,
  onPlanForGoal,
}: YourBestPathRightNowProps) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px", color: "var(--foreground)" }}>
        Your Best Path Right Now
      </h2>

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

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
