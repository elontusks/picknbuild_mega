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
      className="flex flex-col gap-4"
      data-testid="notification-preferences-panel"
      aria-label="Notification preferences"
    >
      <div>
        <h3 className="text-sm font-medium text-foreground">
          Channels
        </h3>
        <div className="mt-2 flex flex-col gap-1">
          {CHANNELS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={prefs.channels[key]}
                onChange={() => toggleChannel(key)}
                data-testid={`channel-${key}`}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-foreground">
          Categories
        </h3>
        <div className="mt-2 flex flex-col gap-1">
          {CATEGORIES.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={prefs.categories[key]}
                onChange={() => toggleCategory(key)}
                data-testid={`category-${key}`}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save preferences"}
        </button>
        {status === "saved" ? (
          <span
            className="text-xs text-green-600"
            data-testid="prefs-saved"
            role="status"
          >
            Saved.
          </span>
        ) : null}
        {status === "error" ? (
          <span className="text-xs text-red-600" role="alert">
            Failed to save. Try again.
          </span>
        ) : null}
      </div>
    </section>
  );
}
