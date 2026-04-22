"use client";

import {
  diffActiveFilters,
  useIntakeBaseline,
  useIntakeReset,
  useIntakeState,
} from "@/lib/intake";

/**
 * Chip that shows how many filter fields differ from the user's baseline
 * (onboarding ZIP / budget / credit). Click "Clear" to reset IntakeState back
 * to the baseline without clearing ZIP.
 */
export function FilterPersistenceIndicator() {
  const state = useIntakeState();
  const baseline = useIntakeBaseline();
  const reset = useIntakeReset();
  const diffs = diffActiveFilters(state, baseline);
  if (diffs.length === 0) return null;

  return (
    <div
      data-intake="filter-persistence"
      data-active-count={diffs.length}
      className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white dark:bg-white dark:text-black"
    >
      <span>
        {diffs.length} filter{diffs.length === 1 ? "" : "s"} active
      </span>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium hover:bg-white/20 dark:bg-black/10 dark:hover:bg-black/20"
      >
        Clear
      </button>
    </div>
  );
}
