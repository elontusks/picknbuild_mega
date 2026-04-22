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
  green: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  yellow: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  red: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
  locked: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

export function CreditScoreInput() {
  const state = useIntakeState();
  const dispatch = useIntakeDispatch();
  const band = creditBandDisplay({
    creditScore: state.creditScore,
    noCredit: state.noCredit,
  });

  const onScore = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (trimmed === "") {
        dispatch({ type: "set-credit-score", creditScore: undefined });
        return;
      }
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n < 300 || n > 850) return;
      dispatch({ type: "set-credit-score", creditScore: Math.round(n) });
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
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Credit score
        </span>
        <input
          type="number"
          inputMode="numeric"
          min={300}
          max={850}
          step={1}
          disabled={state.noCredit}
          value={state.creditScore ?? ""}
          onChange={(e) => onScore(e.target.value)}
          placeholder="e.g. 680"
          className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm disabled:bg-zinc-100 disabled:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:disabled:bg-zinc-800"
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
        <input
          type="checkbox"
          checked={state.noCredit}
          onChange={(e) => onNoCredit(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-600 dark:bg-zinc-800"
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
