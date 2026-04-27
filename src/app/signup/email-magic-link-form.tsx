"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  mode: "signup" | "login";
};

export function EmailMagicLinkForm({ mode }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/auth/email/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), mode }),
      });

      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Could not send magic link.");
        return;
      }

      setSent(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-6 py-12">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {sent
            ? `We sent a magic link to ${email}. Check your email and click the link to continue.`
            : "Sign in with your email — we'll send you a magic link."}
        </p>
      </header>

      {!sent ? (
        <form onSubmit={onSendMagicLink} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-muted-foreground">Email</span>
            <input
              autoFocus
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-lg border border-border bg-background px-3 text-base outline-none focus:border-zinc-950-700-900 dark:focus:border-white"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-muted disabled:opacity-50 dark:hover:bg-muted"
          >
            {pending ? "Sending..." : "Send magic link"}
          </button>
        </form>
      ) : (
        <button
          onClick={() => {
            setSent(false);
            setEmail("");
          }}
          className="text-xs text-muted-foreground underline"
        >
          Try a different email
        </button>
      )}

      {error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
