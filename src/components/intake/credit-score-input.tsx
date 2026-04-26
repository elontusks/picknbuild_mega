"use client";

import { useCallback } from "react";
import {
  useIntakeDispatch,
  useIntakeState,
  creditBandDisplay,
} from "@/lib/intake";

const TONE_CLASSES: Record<
  "green" | "yellow" | "red" | "locked",
  string
> = {
  green: "bg-emerald-400 text-emerald-950",
  yellow: "bg-amber-300 text-amber-900",
  red: "bg-rose-400 text-rose-950",
  locked: "bg-muted text-muted-foreground",
};

const CREDIT_SCORE_OPTIONS = [
  { label: "550 (Sub-prime)", value: 550 },
  { label: "620 (Red tier)", value: 620 },
  { label: "670 (Yellow tier)", value: 670 },
  { label: "720 (Green tier)", value: 720 },
  { label: "760 (Green tier)", value: 760 },
];

export function CreditScoreInput() {
  const state = useIntakeState();
  const dispatch = useIntakeDispatch();
  const band = creditBandDisplay({
    creditScore: state.creditScore,
    noCredit: state.noCredit,
  });

  const onScore = useCallback(
    (value: string) => {
      if (value === "") {
        dispatch({ type: "set-credit-score", creditScore: undefined });
        return;
      }
      const n = Number(value);
      if (Number.isFinite(n)) {
        dispatch({ type: "set-credit-score", creditScore: n });
      }
    },
    [dispatch],
  );

  const onNoCredit = useCallback(
    (checked: boolean) => dispatch({ type: "set-no-credit", noCredit: checked }),
    [dispatch],
  );

  return (
    <div data-intake="credit-score" className="flex flex-col gap-2">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Credit score
        </span>
        <select
          disabled={state.noCredit}
          value={state.creditScore ?? ""}
          onChange={(e) => onScore(e.target.value)}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground shadow-sm disabled:bg-muted disabled:text-muted-foreground"
        >
          <option value="">Select credit score tier</option>
          {CREDIT_SCORE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={state.noCredit}
          onChange={(e) => onNoCredit(e.target.checked)}
          className="h-4 w-4 rounded border border-border bg-background text-accent checked:bg-accent"
        />
        No credit / don&apos;t want to say
      </label>
      <span
        data-band={band.tone}
        className={`inline-flex w-fit items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${TONE_CLASSES[band.tone]}`}
      >
        {band.label}
        <span className="font-normal opacity-80">· {band.helper}</span>
      </span>
    </div>
  );
}
