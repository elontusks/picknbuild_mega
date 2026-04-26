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
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Title
        </span>
        <CleanRebuiltTooltip />
      </div>
      <div
        role="radiogroup"
        aria-label="Title preference"
        className="inline-flex rounded-lg border border-border bg-background p-0.5-700-900"
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
                  ? "bg-muted text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted dark:hover:bg-muted"
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
