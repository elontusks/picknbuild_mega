"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ConversionState,
  ListingObject,
  PathKind,
  ThreadKind,
} from "@/contracts";

type AvailableActionsBarProps = {
  listing: ListingObject;
  conversionState: ConversionState;
};

const pathFromListing = (source: ListingObject["source"]): PathKind => {
  if (source === "copart" || source === "iaai") return "auction";
  if (source === "dealer") return "dealer";
  if (source === "craigslist" || source === "user") return "private";
  return "picknbuild";
};

const threadKindForSource = (
  source: ListingObject["source"],
): ThreadKind | null => {
  if (source === "dealer") return "buyer-dealer";
  if (source === "craigslist" || source === "user") return "buyer-seller";
  return null;
};

export function AvailableActionsBar({
  listing,
  conversionState,
}: AvailableActionsBarProps) {
  const router = useRouter();
  const [state, setState] = useState<ConversionState>(conversionState);
  const [pending, setPending] = useState<null | "start" | "message" | "commit">(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const defaultPath = pathFromListing(listing.source);
  const threadKind = threadKindForSource(listing.source);

  async function markDecided(path: PathKind) {
    if (state !== "decided") return;
    setError(null);
    setPending("start");
    try {
      const res = await fetch("/api/conversions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          path,
          from: "decided",
          to: "payment-initiated",
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        state?: ConversionState;
        error?: string;
        reason?: string;
      };
      if (!res.ok || json.ok === false) {
        setError(json.error ?? json.reason ?? "Could not start that path.");
        return;
      }
      if (json.state) setState(json.state);
      if (path === "picknbuild") {
        router.push(`/configurator?listingId=${listing.id}`);
      } else {
        setNotice("Signal recorded. We'll keep this path on your radar.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setPending(null);
    }
  }

  async function openThread() {
    if (!threadKind) return;
    setError(null);
    setPending("message");
    try {
      const res = await fetch("/api/threads/open", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: threadKind,
          listingId: listing.id,
          ...(listing.ownerUserId
            ? { otherParticipantId: listing.ownerUserId }
            : {}),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        thread?: { id: string };
        error?: string;
      };
      if (!res.ok || !json.thread) {
        setError(json.error ?? "Could not open message thread.");
        return;
      }
      router.push(`/messages/${json.thread.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setPending(null);
    }
  }

  const canMessage = threadKind !== null;
  const startLabel =
    defaultPath === "picknbuild"
      ? "Commit with picknbuild"
      : defaultPath === "auction"
        ? "Plan to bid myself"
        : defaultPath === "dealer"
          ? "Send dealer lead"
          : "Contact seller";

  return (
    <div
      data-testid="available-actions-bar"
      data-conversion-state={state}
      className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background p-3-800-950"
    >
      <button
        type="button"
        data-testid="action-start"
        onClick={() => markDecided(defaultPath)}
        disabled={pending !== null || state !== "decided"}
        className="rounded bg-black px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
      >
        {pending === "start" ? "…" : startLabel}
      </button>
      {canMessage ? (
        <button
          type="button"
          data-testid="action-message"
          onClick={openThread}
          disabled={pending !== null}
          className="rounded border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-60-700-900 dark:hover:bg-muted"
        >
          {pending === "message"
            ? "Opening…"
            : threadKind === "buyer-dealer"
              ? "Message dealer"
              : "Message seller"}
        </button>
      ) : null}
      <button
        type="button"
        data-testid="action-picknbuild"
        onClick={() => {
          router.push(`/configurator?listingId=${listing.id}`);
        }}
        disabled={pending !== null}
        className="rounded border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-60-700-900 dark:hover:bg-muted"
      >
        Build this with picknbuild
      </button>
      {notice ? (
        <span data-testid="action-notice" className="text-xs text-muted-foreground">
          {notice}
        </span>
      ) : null}
      {error ? (
        <span role="alert" className="text-xs text-red-600">
          {error}
        </span>
      ) : null}
    </div>
  );
}
