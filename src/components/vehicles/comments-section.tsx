"use client";

import { useMemo, useState } from "react";
import type { ListingComment } from "@/lib/listings/comments";

type CommentsSectionProps = {
  listingId: string;
  initialComments: ListingComment[];
  currentUserId: string;
};

type ViewModel = {
  top: ListingComment[];
  repliesByParent: Map<string, ListingComment[]>;
};

const toViewModel = (comments: ListingComment[]): ViewModel => {
  const top: ListingComment[] = [];
  const repliesByParent = new Map<string, ListingComment[]>();
  for (const c of comments) {
    if (c.parentId) {
      const list = repliesByParent.get(c.parentId) ?? [];
      list.push(c);
      repliesByParent.set(c.parentId, list);
    } else {
      top.push(c);
    }
  }
  return { top, repliesByParent };
};

const formatTs = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
};

export function CommentsSection({
  listingId,
  initialComments,
  currentUserId,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<ListingComment[]>(initialComments);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const vm = useMemo(() => toViewModel(comments), [comments]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!draft.trim()) {
      setError("Comment cannot be empty.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          body: draft,
          ...(replyTo ? { parentId: replyTo } : {}),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        comment?: ListingComment;
        error?: string;
      };
      if (!res.ok || !json.comment) {
        setError(json.error ?? "Could not post comment.");
        return;
      }
      setComments((prev) => [...prev, json.comment!]);
      setDraft("");
      setReplyTo(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      data-testid="comments-section"
      aria-label="Comments and replies"
      className="space-y-4"
    >
      <header>
        <h2 className="text-base font-semibold text-foreground">
          Comments
        </h2>
        <p className="text-xs text-muted-foreground">
          {comments.length === 0
            ? "Start the conversation. Buyers can share questions or notes about this listing."
            : `${comments.length} comment${comments.length === 1 ? "" : "s"}`}
        </p>
      </header>

      <ul data-testid="comments-list" className="space-y-3">
        {vm.top.map((c) => {
          const replies = vm.repliesByParent.get(c.id) ?? [];
          return (
            <li
              key={c.id}
              data-testid={`comment-${c.id}`}
              data-author-id={c.authorId}
              className="rounded-lg border border-border bg-background p-3 text-sm-800-950"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium text-foreground">
                  {c.authorName}
                  {c.authorId === currentUserId ? (
                    <span className="ml-2 text-[10px] uppercase text-zinc-400">
                      you
                    </span>
                  ) : null}
                </span>
                <time className="text-xs text-muted-foreground">
                  {formatTs(c.createdAt)}
                </time>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-zinc-800">
                {c.body}
              </p>
              <div className="mt-2">
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                  onClick={() => {
                    setReplyTo(c.id);
                    setError(null);
                  }}
                >
                  Reply
                </button>
              </div>
              {replies.length > 0 ? (
                <ul className="mt-3 space-y-2 border-l-2 border-border pl-3-800">
                  {replies.map((r) => (
                    <li
                      key={r.id}
                      data-testid={`reply-${r.id}`}
                      data-parent-id={r.parentId ?? ""}
                      className="text-sm"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium text-zinc-800">
                          {r.authorName}
                          {r.authorId === currentUserId ? (
                            <span className="ml-2 text-[10px] uppercase text-zinc-400">
                              you
                            </span>
                          ) : null}
                        </span>
                        <time className="text-xs text-muted-foreground">
                          {formatTs(r.createdAt)}
                        </time>
                      </div>
                      <p className="mt-0.5 whitespace-pre-wrap text-muted-foreground">
                        {r.body}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>

      <form
        data-testid="comment-form"
        onSubmit={submit}
        className="space-y-2 rounded-lg border border-border bg-background p-3-800-900"
      >
        {replyTo ? (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span data-testid="reply-indicator">
              Replying to a comment
            </span>
            <button
              type="button"
              className="text-muted-foreground underline-offset-2 hover:underline"
              onClick={() => setReplyTo(null)}
            >
              Cancel reply
            </button>
          </div>
        ) : null}
        <label className="block text-xs text-muted-foreground">
          Your comment
          <textarea
            data-testid="comment-draft"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-sm-700-950"
            placeholder={
              replyTo ? "Write a reply…" : "Ask a question or share a note."
            }
          />
        </label>
        {error ? (
          <p role="alert" className="text-xs text-red-600">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-black px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
          >
            {pending ? "Posting…" : replyTo ? "Post reply" : "Post comment"}
          </button>
        </div>
      </form>
    </section>
  );
}
