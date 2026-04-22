"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function MessageComposer({ threadId }: { threadId: string }) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, body: trimmed }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(json.error ?? "Failed to send");
        return;
      }
      setBody("");
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={submit}
      className="flex items-end gap-2 border-t border-zinc-200 pt-2 dark:border-zinc-800"
      data-testid="message-composer"
    >
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a message…"
        rows={2}
        className="flex-1 resize-none rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
        disabled={isPending}
      />
      <button
        type="submit"
        disabled={isPending || body.trim().length === 0}
        className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? "Sending…" : "Send"}
      </button>
      {error ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
