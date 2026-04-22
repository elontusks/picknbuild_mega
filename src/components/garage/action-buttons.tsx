"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { ConversionState, ListingObject, PathKind } from "@/contracts";

type Props = {
  listing: ListingObject;
  conversionState: ConversionState;
};

type MessageKind = "buyer-dealer" | "buyer-seller" | "buyer-picknbuild";

const KIND_LABEL: Record<MessageKind, string> = {
  "buyer-dealer": "Contact dealer",
  "buyer-seller": "Message seller",
  "buyer-picknbuild": "Talk to picknbuild",
};

const messageKindForListing = (listing: ListingObject): MessageKind => {
  if (listing.source === "dealer") return "buyer-dealer";
  if (listing.source === "user" || listing.source === "craigslist") {
    return "buyer-seller";
  }
  return "buyer-picknbuild";
};

/**
 * Garage action row. Wires Start picknbuild → Team 9's Configurator route,
 * Contact/Message → Team 13's openOrCreateThread through the existing
 * /api/threads/open endpoint, and Compare all paths → Team 7's detail page.
 * ConversionState beyond `decided` swaps the primary action into a disabled
 * "In progress" chip so the user can't re-enter checkout on the same listing.
 */
export function GarageActionButtons({ listing, conversionState }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);

  const messageKind = messageKindForListing(listing);

  const openThread = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/threads/open", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: messageKind,
            listingId: listing.id,
            otherParticipantId: listing.ownerUserId,
          }),
        });
        const body = (await res.json().catch(() => ({}))) as {
          thread?: { id: string };
          error?: string;
        };
        if (!res.ok || !body.thread) {
          setError(body.error ?? "Could not open thread");
          return;
        }
        setThreadId(body.thread.id);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Network error");
      }
    });
  };

  const pastDecided = conversionState !== "decided";

  return (
    <div
      data-testid="garage-actions"
      data-conversion-state={conversionState}
      className="flex flex-wrap items-center gap-2"
    >
      {pastDecided ? (
        <span
          data-testid="garage-action-in-progress"
          className="inline-flex items-center rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100"
        >
          In progress · {conversionState.replace("-", " ")}
        </span>
      ) : (
        <Link
          data-testid="garage-action-start-picknbuild"
          href={`/configurator/${listing.id}`}
          className="inline-flex items-center rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
        >
          Start picknbuild
        </Link>
      )}
      <Link
        data-testid="garage-action-compare"
        href={`/listings/${listing.id}`}
        className="inline-flex items-center rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
      >
        Compare all paths
      </Link>
      {threadId ? (
        <Link
          data-testid="garage-action-view-thread"
          href={`/inbox/${threadId}`}
          className="inline-flex items-center rounded-md border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-200"
        >
          Open thread
        </Link>
      ) : (
        <button
          type="button"
          data-testid="garage-action-message"
          data-kind={messageKind}
          onClick={openThread}
          disabled={isPending}
          className="inline-flex items-center rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          {isPending ? "Opening…" : KIND_LABEL[messageKind]}
        </button>
      )}
      {error ? (
        <span
          data-testid="garage-action-error"
          className="text-[11px] text-rose-600 dark:text-rose-400"
        >
          {error}
        </span>
      ) : null}
    </div>
  );
}

export type { PathKind };
