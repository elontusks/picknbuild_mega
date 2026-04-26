"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "signup" | "login";

type Step = "phone" | "code";

type Props = {
  mode: Mode;
};

function normalizePhone(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return trimmed;
  // Default to US country code if user typed bare digits.
  const digits = trimmed.replace(/\D+/g, "");
  return digits ? `+${digits.length === 10 ? "1" : ""}${digits}` : "";
}

/**
 * Shared phone-OTP form used by /signup and /login. Supabase auth treats both
 * verbs identically — `signInWithOtp` creates the user on first verify — so
 * the only difference between modes is copy and the post-verify destination
 * for already-onboarded users.
 */
export function PhoneAuthForm({ mode }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const normalized = normalizePhone(phone);
    if (!normalized) {
      setError("Enter your mobile number with country code, e.g. +15555550100.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/auth/phone/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Could not send code.");
        return;
      }
      setPhone(normalized);
      setStep("code");
    } finally {
      setPending(false);
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!code.trim()) {
      setError("Enter the 6-digit code we just sent.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/auth/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: code.trim() }),
      });
      const body = (await res.json()) as {
        error?: string;
        needsOnboarding?: boolean;
      };
      if (!res.ok) {
        setError(body.error ?? "Could not verify code.");
        return;
      }
      // Signup flow always sends new accounts to onboarding. Login flow only
      // detours through onboarding if the profile is missing required fields.
      if (mode === "signup" || body.needsOnboarding) {
        router.replace("/onboarding");
      } else {
        router.replace("/");
      }
      router.refresh();
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
          {step === "phone"
            ? "Sign in with your mobile number — we'll text you a one-time code."
            : `Enter the 6-digit code sent to ${phone}.`}
        </p>
      </header>

      {step === "phone" ? (
        <form onSubmit={onSendCode} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-muted-foreground">
              Mobile number
            </span>
            <input
              autoFocus
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+1 555 555 0100"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-11 rounded-lg border border-border bg-background px-3 text-base outline-none focus:border-zinc-950-700-900 dark:focus:border-white"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-muted disabled:opacity-50 dark:hover:bg-muted"
          >
            {pending ? "Sending..." : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={onVerify} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-muted-foreground">
              Verification code
            </span>
            <input
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-11 rounded-lg border border-border bg-background px-3 text-base tracking-widest outline-none focus:border-zinc-950-700-900 dark:focus:border-white"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-muted disabled:opacity-50 dark:hover:bg-muted"
          >
            {pending ? "Verifying..." : "Verify and continue"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setCode("");
              setError(null);
            }}
            className="text-xs text-muted-foreground underline"
          >
            Use a different number
          </button>
        </form>
      )}

      {error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
