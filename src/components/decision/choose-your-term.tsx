"use client";

import type { Term } from "@/contracts";
import { useIntakeDispatch, useIntakeState } from "@/lib/intake";

const TERM_OPTIONS: Array<{ value: Term; label: string }> = [
  { value: "cash", label: "Cash" },
  { value: "1y", label: "1 yr" },
  { value: "2y", label: "2 yr" },
  { value: "3y", label: "3 yr" },
  { value: "4y", label: "4 yr" },
  { value: "5y", label: "5 yr" },
];

type Props = {
  /** Paths that ignore term (auction, private) dim this control. */
  enabled?: boolean;
};

/**
 * Choose Your Term selector (ch/09, ch/10, ch/14). Writes
 * `IntakeState.selectedTerm` so Dealer and picknbuild gap modules pick up the
 * new term on the next render. Cash term collapses picknbuild biweekly and
 * dealer monthly/APR to $0 — that's intentional and honored by Team 11's
 * pricing service.
 */
export function ChooseYourTerm({ enabled = true }: Props) {
  const intake = useIntakeState();
  const dispatch = useIntakeDispatch();
  const active: Term = intake.selectedTerm ?? "3y";

  return (
    <fieldset
      data-decision="choose-your-term"
      data-testid="choose-your-term"
      aria-label="Choose your term"
      disabled={!enabled}
      className="flex flex-wrap items-center gap-2"
    >
      <legend className="sr-only">Choose your term</legend>
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Term
      </span>
      <div
        role="radiogroup"
        className="inline-flex overflow-hidden rounded-lg border border-border bg-background text-xs-700-900"
      >
        {TERM_OPTIONS.map((opt) => {
          const isActive = opt.value === active;
          return (
            <button
              type="button"
              key={opt.value}
              role="radio"
              aria-checked={isActive}
              data-testid={`term-${opt.value}`}
              disabled={!enabled}
              onClick={() =>
                dispatch({ type: "set-selected-term", selectedTerm: opt.value })
              }
              className={`px-3 py-1.5 font-medium transition-colors ${
                isActive
                  ? "bg-muted text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted disabled:opacity-40 dark:hover:bg-muted"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
