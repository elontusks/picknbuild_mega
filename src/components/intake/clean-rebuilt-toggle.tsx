"use client";

import type { TitlePreference } from "@/contracts";
import { useIntakeDispatch, useIntakeState } from "@/lib/intake";
import { CleanRebuiltTooltip } from "./clean-rebuilt-tooltip";

const OPTIONS: Array<{ value: TitlePreference; label: string }> = [
  { value: "both", label: "Both" },
  { value: "clean", label: "Clean" },
  { value: "rebuilt", label: "Rebuilt" },
];

export function CleanRebuiltToggle() {
  const state = useIntakeState();
  const dispatch = useIntakeDispatch();

  return (
    <div
      data-intake="clean-rebuilt-toggle"
      className="flex flex-col gap-1.5"
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Title
        </span>
        <CleanRebuiltTooltip />
      </div>
      <div
        role="radiogroup"
        aria-label="Title preference"
        className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-700 dark:bg-zinc-900"
      >
        {OPTIONS.map((opt) => {
          const active = state.titlePreference === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              data-value={opt.value}
              onClick={() =>
                dispatch({
                  type: "set-title-preference",
                  titlePreference: opt.value,
                })
              }
              className={`h-8 rounded-md px-3 text-sm font-medium transition ${
                active
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
