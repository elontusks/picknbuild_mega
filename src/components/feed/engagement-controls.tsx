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
      className="flex flex-col gap-2 border-t border-zinc-100 pt-2-900"
    >
      <div className="flex items-center gap-3 text-xs">
        <button
          type="button"
          data-testid="like-btn"
          onClick={handleLike}
          disabled={!canInteract || pending}
          className={`rounded-full px-2 py-1 font-medium transition ${
            liked
              ? "bg-rose-100 text-rose-800-900/30 dark:text-rose-200"
              : "bg-muted text-muted-foreground-800"
          } disabled:opacity-50`}
          aria-pressed={liked}
        >
          {liked ? "♥" : "♡"} {likeCount}
        </button>
        <span className="text-muted-foreground">
          {commentCount} {commentCount === 1 ? "comment" : "comments"}
        </span>
        <button
          type="button"
          data-testid="share-btn"
          onClick={handleShare}
          className="text-muted-foreground hover:underline"
        >
          Share
        </button>
        {shareMsg ? (
          <span
            role="status"
            data-testid="share-msg"
            className="text-emerald-700 dark:text-emerald-300"
          >
            {shareMsg}
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
            placeholder="Write a comment or @reply..."
            className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-sm-800-950"
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
            className="rounded-md bg-muted px-3 py-1 text-sm font-medium text-primary-foreground disabled:opacity-40-100"
          >
            Post
          </button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Sign in to like, comment, or share.
        </p>
      )}
      {error ? (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
