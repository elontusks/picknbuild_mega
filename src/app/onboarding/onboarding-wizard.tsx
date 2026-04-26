"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BestFitPreference } from "@/contracts";

type WizardState = {
  zip: string;
  budget: string;
  creditScore: string;
  noCredit: boolean;
  displayName: string;
  bestFit: BestFitPreference;
  notifChannels: string[];
};

const STEPS = ["zip", "budget", "credit", "preferences"] as const;
type StepKey = (typeof STEPS)[number];

const STEP_LABELS: Record<StepKey, string> = {
  zip: "Where are you?",
  budget: "What's your cash budget?",
  credit: "Credit estimate",
  preferences: "Notification preferences",
};

export function OnboardingWizard({
  initialDisplayName,
}: {
  initialDisplayName?: string;
}) {
  const router = useRouter();
  const [stepIdx, setStepIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<WizardState>({
    zip: "",
    budget: "",
    creditScore: "",
    noCredit: false,
    displayName: initialDisplayName ?? "",
    bestFit: "lowestTotal",
    notifChannels: ["in-app", "email"],
  });

  const step = STEPS[stepIdx]!;
  const isLast = stepIdx === STEPS.length - 1;

  function next() {
    setError(null);
    if (step === "zip" && !/^\d{5}$/.test(state.zip)) {
      setError("Enter a 5-digit ZIP.");
      return;
    }
    if (step === "budget") {
      const n = Number(state.budget);
      if (!Number.isFinite(n) || n < 0) {
        setError("Budget must be a non-negative number (in dollars).");
        return;
      }
    }
    if (step === "credit" && !state.noCredit && state.creditScore) {
      const n = Number(state.creditScore);
      if (!Number.isInteger(n) || n < 300 || n > 850) {
        setError("Credit score must be 300–850, or check 'No credit'.");
        return;
      }
    }
    setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
  }

  function back() {
    setError(null);
    setStepIdx((i) => Math.max(i - 1, 0));
  }

  async function submit() {
    setError(null);
    setPending(true);
    try {
      const payload = {
        zip: state.zip,
        budget: state.budget ? Number(state.budget) : undefined,
        creditScore:
          !state.noCredit && state.creditScore
            ? Number(state.creditScore)
            : undefined,
        noCredit: state.noCredit || undefined,
        displayName: state.displayName || undefined,
        bestFit: state.bestFit,
        notifChannels: state.notifChannels,
      };
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Could not save onboarding.");
        return;
      }
      router.replace("/");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-12">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Step {stepIdx + 1} of {STEPS.length}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {STEP_LABELS[step]}
        </h1>
      </header>

      <div className="flex flex-col gap-4">
        {step === "zip" ? (
          <>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-muted-foreground">
                ZIP code (used for distance, never auto-updated)
              </span>
              <input
                autoFocus
                inputMode="numeric"
                maxLength={5}
                placeholder="43210"
                value={state.zip}
                onChange={(e) =>
                  setState((s) => ({ ...s, zip: e.target.value.replace(/\D+/g, "") }))
                }
                className="h-11 rounded-lg border border-border bg-background px-3 text-base outline-none focus:border-zinc-950-700-900 dark:focus:border-white"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-muted-foreground">
                Display name (optional)
              </span>
              <input
                placeholder="What should we call you?"
                value={state.displayName}
                onChange={(e) =>
                  setState((s) => ({ ...s, displayName: e.target.value }))
                }
                className="h-11 rounded-lg border border-border bg-background px-3 text-base outline-none focus:border-zinc-950-700-900 dark:focus:border-white"
              />
            </label>
          </>
        ) : null}

        {step === "budget" ? (
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-muted-foreground">
              Cash you can put down today (USD)
            </span>
            <input
              autoFocus
              inputMode="numeric"
              placeholder="3000"
              value={state.budget}
              onChange={(e) =>
                setState((s) => ({ ...s, budget: e.target.value.replace(/[^\d]/g, "") }))
              }
              className="h-11 rounded-lg border border-border bg-background px-3 text-base outline-none focus:border-zinc-950-700-900 dark:focus:border-white"
            />
          </label>
        ) : null}

        {step === "credit" ? (
          <>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-muted-foreground">
                Estimated credit score (300–850)
              </span>
              <input
                disabled={state.noCredit}
                inputMode="numeric"
                placeholder="680"
                value={state.creditScore}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    creditScore: e.target.value.replace(/[^\d]/g, ""),
                  }))
                }
                className="h-11 rounded-lg border border-border bg-background px-3 text-base outline-none focus:border-zinc-950 disabled:opacity-50-700-900 dark:focus:border-white"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={state.noCredit}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    noCredit: e.target.checked,
                    creditScore: e.target.checked ? "" : s.creditScore,
                  }))
                }
              />
              <span>I have no credit history.</span>
            </label>
          </>
        ) : null}

        {step === "preferences" ? (
          <>
            <fieldset className="flex flex-col gap-2 text-sm">
              <legend className="font-medium text-muted-foreground">
                Best-fit preference
              </legend>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="bestFit"
                  value="lowestTotal"
                  checked={state.bestFit === "lowestTotal"}
                  onChange={() => setState((s) => ({ ...s, bestFit: "lowestTotal" }))}
                />
                <span>Lowest total cost</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="bestFit"
                  value="lowestMonthly"
                  checked={state.bestFit === "lowestMonthly"}
                  onChange={() => setState((s) => ({ ...s, bestFit: "lowestMonthly" }))}
                />
                <span>Lowest monthly / bi-weekly</span>
              </label>
            </fieldset>
            <fieldset className="flex flex-col gap-2 text-sm">
              <legend className="font-medium text-muted-foreground">
                Notification channels
              </legend>
              {(["in-app", "email", "digest"] as const).map((ch) => (
                <label key={ch} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={state.notifChannels.includes(ch)}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        notifChannels: e.target.checked
                          ? Array.from(new Set([...s.notifChannels, ch]))
                          : s.notifChannels.filter((c) => c !== ch),
                      }))
                    }
                  />
                  <span className="capitalize">{ch}</span>
                </label>
              ))}
            </fieldset>
          </>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={back}
          disabled={stepIdx === 0 || pending}
          className="text-sm text-muted-foreground disabled:opacity-50"
        >
          Back
        </button>
        {isLast ? (
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-muted disabled:opacity-50 dark:hover:bg-muted"
          >
            {pending ? "Saving..." : "Finish"}
          </button>
        ) : (
          <button
            type="button"
            onClick={next}
            disabled={pending}
            className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-muted disabled:opacity-50 dark:hover:bg-muted"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
