"use client";

import { useState, useTransition } from "react";
import type { NotificationCategory, NotificationChannel } from "@/contracts";
import type { NotificationPreferences } from "@/services/team-13-notifications";

const CHANNELS: { key: NotificationChannel; label: string }[] = [
  { key: "in-app", label: "In-app" },
  { key: "email", label: "Email" },
  { key: "digest", label: "Email digest" },
];

const CATEGORIES: { key: NotificationCategory; label: string }[] = [
  { key: "message", label: "Messages" },
  { key: "price-change", label: "Price changes" },
  { key: "dealer-response", label: "Dealer responses" },
  { key: "payment", label: "Payments" },
  { key: "deal-status", label: "Deal status" },
  { key: "system", label: "System" },
];

export function NotificationPreferencesPanel({
  initial,
}: {
  initial: NotificationPreferences;
}) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(initial);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  const toggleChannel = (key: NotificationChannel) => {
    setPrefs((p) => ({
      ...p,
      channels: { ...p.channels, [key]: !p.channels[key] },
    }));
  };
  const toggleCategory = (key: NotificationCategory) => {
    setPrefs((p) => ({
      ...p,
      categories: { ...p.categories, [key]: !p.categories[key] },
    }));
  };

  const save = () => {
    setStatus("idle");
    startTransition(async () => {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      setStatus(res.ok ? "saved" : "error");
    });
  };

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
      data-testid="notification-preferences-panel"
      aria-label="Notification preferences"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase', margin: 0 }}>
          Notification Channels
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {CHANNELS.map(({ key, label }) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--foreground)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={prefs.channels[key]}
                onChange={() => toggleChannel(key)}
                data-testid={`channel-${key}`}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ height: '1px', backgroundColor: 'var(--border)' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase', margin: 0 }}>
          Notification Types
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {CATEGORIES.map(({ key, label }) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--foreground)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={prefs.categories[key]}
                onChange={() => toggleCategory(key)}
                data-testid={`category-${key}`}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          style={{
            padding: '10px 16px',
            backgroundColor: 'var(--accent)',
            color: 'var(--accent-foreground)',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: isPending ? 'not-allowed' : 'pointer',
            opacity: isPending ? 0.6 : 1,
            transition: 'all 200ms ease-out',
          }}
          onMouseEnter={(e) => !isPending && (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => !isPending && (e.currentTarget.style.opacity = '1')}
        >
          {isPending ? "Saving…" : "Save preferences"}
        </button>
        {status === "saved" ? (
          <span
            style={{ fontSize: '12px', color: '#10b981', fontWeight: '500' }}
            data-testid="prefs-saved"
            role="status"
          >
            ✓ Preferences saved
          </span>
        ) : null}
        {status === "error" ? (
          <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: '500' }} role="alert">
            Failed to save. Try again.
          </span>
        ) : null}
      </div>
    </section>
  );
}
