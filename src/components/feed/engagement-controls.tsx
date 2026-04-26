"use client";

import { useState, useTransition } from "react";
import { togglePostLike, submitFeedComment } from "@/app/feed/actions";

type EngagementProps = {
  postId: string;
  initialLiked: boolean;
  initialLikeCount: number;
  initialCommentCount: number;
  canInteract: boolean;
  permalinkPath: string;
};

// Like / comment / reply / share for a feed post. Reply is a one-level
// nested comment (we submit the prefix `@userId ` for v1). Share copies
// the permalink — no real share system by design.
export function FeedEngagementControls({
  postId,
  initialLiked,
  initialLikeCount,
  initialCommentCount,
  canInteract,
  permalinkPath,
}: EngagementProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [commentDraft, setCommentDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleLike = () => {
    if (!canInteract) return;
    setError(null);
    startTransition(async () => {
      const result = await togglePostLike({ postId, liked });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setLiked(result.liked);
      setLikeCount(result.count);
    });
  };

  const handleComment = () => {
    if (!canInteract) return;
    const body = commentDraft.trim();
    if (!body) return;
    setError(null);
    startTransition(async () => {
      const result = await submitFeedComment({ postId, body });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCommentDraft("");
      setCommentCount((n) => n + 1);
    });
  };

  const handleShare = async () => {
    const url =
      typeof window !== "undefined"
        ? new URL(permalinkPath, window.location.origin).toString()
        : permalinkPath;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setShareMsg("Link copied");
      } else {
        setShareMsg(url);
      }
    } catch {
      setShareMsg(url);
    }
    setTimeout(() => setShareMsg(null), 2500);
  };

  return (
    <div
      data-testid={`engagement-${postId}`}
      className="flex flex-col gap-3 border-t border-border/50 pt-4"
    >
      <div className="flex items-center gap-2 text-xs">
        <button
          type="button"
          data-testid="like-btn"
          onClick={handleLike}
          disabled={!canInteract || pending}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition duration-200 ${
            liked
              ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
              : "bg-muted text-muted-foreground hover:bg-muted/80 active:scale-95"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-pressed={liked}
        >
          <span>{liked ? "♥" : "♡"}</span>
          <span className="font-semibold">{likeCount}</span>
        </button>
        <div className="flex items-center gap-1.5 px-2 py-1.5 text-muted-foreground">
          <span>💬</span>
          <span className="font-medium">{commentCount}</span>
        </div>
        <button
          type="button"
          data-testid="share-btn"
          onClick={handleShare}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition duration-200"
        >
          <span>🔗</span>
          <span className="font-medium">Share</span>
        </button>
        {shareMsg ? (
          <span
            role="status"
            data-testid="share-msg"
            className="ml-auto text-emerald-600 dark:text-emerald-400 font-medium"
          >
            ✓ {shareMsg}
          </span>
        ) : null}
      </div>
      {canInteract ? (
        <div className="flex gap-2">
          <input
            type="text"
            data-testid="comment-input"
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleComment();
              }
            }}
          />
          <button
            type="button"
            data-testid="comment-btn"
            onClick={handleComment}
            disabled={pending || commentDraft.trim().length === 0}
            className="rounded-lg bg-accent text-accent-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
          >
            {pending ? "..." : "Post"}
          </button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">
          👤 Sign in to like, comment, or share.
        </p>
      )}
      {error ? (
        <p role="alert" className="text-xs text-red-600 font-medium">
          ⚠️ {error}
        </p>
      ) : null}
    </div>
  );
}
