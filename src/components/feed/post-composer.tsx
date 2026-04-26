"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitFeedPost } from "@/app/feed/actions";
import { FEED_POST_KINDS, type FeedPostKind } from "@/lib/feed/types";
import { MediaUploadInterface } from "./media-upload";

const KIND_PLACEHOLDER: Record<FeedPostKind, string> = {
  deal: "Share the deal you just landed...",
  problem: "Describe the problem or experience...",
  question: "Ask the community a question...",
  build: "Share your build progress...",
  recommendation: "Recommend a vehicle or shop...",
  warning: "Warn others about something...",
};

// Feed post composer. Client-only so we can vary inputs by kind without
// a full page reload. Calls submitFeedPost() which revalidates /feed.
export function PostComposer() {
  const router = useRouter();
  const [kind, setKind] = useState<FeedPostKind>("deal");
  const [body, setBody] = useState("");
  const [mediaRefs, setMediaRefs] = useState<string[]>([]);
  const [listingId, setListingId] = useState("");
  const [dealPrice, setDealPrice] = useState("");
  const [recommendationTarget, setRecommendationTarget] = useState("");
  const [warningSeverity, setWarningSeverity] =
    useState<"low" | "med" | "high">("med");
  const [buildBeforeRef, setBuildBeforeRef] = useState("");
  const [buildAfterRef, setBuildAfterRef] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const reset = () => {
    setBody("");
    setMediaRefs([]);
    setListingId("");
    setDealPrice("");
    setRecommendationTarget("");
    setWarningSeverity("med");
    setBuildBeforeRef("");
    setBuildAfterRef("");
  };

  const onSubmit = () => {
    setError(null);
    if (body.trim().length === 0) {
      setError("Post body cannot be empty.");
      return;
    }
    startTransition(async () => {
      const result = await submitFeedPost({
        kind,
        body,
        ...(listingId ? { listingId } : {}),
        ...(mediaRefs.length > 0 ? { mediaRefs } : {}),
        ...(kind === "deal" && dealPrice
          ? { dealPrice: Number(dealPrice) }
          : {}),
        ...(kind === "build" && buildBeforeRef
          ? { buildBeforeRef }
          : {}),
        ...(kind === "build" && buildAfterRef
          ? { buildAfterRef }
          : {}),
        ...(kind === "recommendation" && recommendationTarget
          ? { recommendationTarget }
          : {}),
        ...(kind === "warning" ? { warningSeverity } : {}),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      reset();
      router.refresh();
    });
  };

  return (
    <section
      data-testid="post-composer"
      className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 shadow-sm-800-950"
    >
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-muted-foreground">
          Type
        </label>
        <select
          data-testid="composer-kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as FeedPostKind)}
          className="rounded-md border border-border bg-background px-2 py-1 text-sm-800-950"
        >
          {FEED_POST_KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>

      <textarea
        data-testid="composer-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={KIND_PLACEHOLDER[kind]}
        rows={3}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm-800-950"
      />

      <div className="flex flex-col gap-2 text-xs">
        <label className="flex items-center gap-2">
          <span className="text-muted-foreground">Linked listing id (optional)</span>
          <input
            data-testid="composer-listing-id"
            value={listingId}
            onChange={(e) => setListingId(e.target.value)}
            placeholder="e.g. listing_0001"
            className="flex-1 rounded-md border border-border bg-background px-2 py-1-800-950"
          />
        </label>

        {kind === "deal" ? (
          <label className="flex items-center gap-2">
            <span className="text-muted-foreground">Deal price</span>
            <input
              data-testid="composer-deal-price"
              type="number"
              value={dealPrice}
              onChange={(e) => setDealPrice(e.target.value)}
              className="w-40 rounded-md border border-border bg-background px-2 py-1-800-950"
            />
          </label>
        ) : null}

        {kind === "build" ? (
          <>
            <label className="flex items-center gap-2">
              <span className="text-muted-foreground">Before image ref</span>
              <input
                value={buildBeforeRef}
                onChange={(e) => setBuildBeforeRef(e.target.value)}
                className="flex-1 rounded-md border border-border bg-background px-2 py-1-800-950"
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="text-muted-foreground">After image ref</span>
              <input
                value={buildAfterRef}
                onChange={(e) => setBuildAfterRef(e.target.value)}
                className="flex-1 rounded-md border border-border bg-background px-2 py-1-800-950"
              />
            </label>
          </>
        ) : null}

        {kind === "recommendation" ? (
          <label className="flex items-center gap-2">
            <span className="text-muted-foreground">Recommending</span>
            <input
              value={recommendationTarget}
              onChange={(e) => setRecommendationTarget(e.target.value)}
              className="flex-1 rounded-md border border-border bg-background px-2 py-1-800-950"
            />
          </label>
        ) : null}

        {kind === "warning" ? (
          <label className="flex items-center gap-2">
            <span className="text-muted-foreground">Severity</span>
            <select
              data-testid="composer-warning-severity"
              value={warningSeverity}
              onChange={(e) =>
                setWarningSeverity(e.target.value as "low" | "med" | "high")
              }
              className="rounded-md border border-border bg-background px-2 py-1-800-950"
            >
              <option value="low">low</option>
              <option value="med">med</option>
              <option value="high">high</option>
            </select>
          </label>
        ) : null}
      </div>

      <MediaUploadInterface
        testId="composer-media"
        refs={mediaRefs}
        onChange={setMediaRefs}
      />

      <div className="flex items-center justify-between">
        <button
          type="button"
          data-testid="composer-submit"
          onClick={onSubmit}
          disabled={pending}
          className="rounded-md bg-muted px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40-100"
        >
          {pending ? "Posting..." : "Post"}
        </button>
        {error ? (
          <p role="alert" className="text-xs text-red-600">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
