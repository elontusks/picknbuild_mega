"use client";

import { useIntakeDispatch, useIntakeState } from "@/lib/intake";

/**
 * Switches IntakeState.matchMode. When on, downstream search surfaces query
 * Team 11's matching engine (cash/credit/title/location reality filter) via
 * /api/search/match instead of raw listings. No button submits anything —
 * Live-update rule (§2): any flip triggers recompute.
 */
export function MatchModeToggle() {
  const state = useIntakeState();
  const dispatch = useIntakeDispatch();
  return (
    <label
      data-intake="match-mode-toggle"
      className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm-700-900"
    >
      <input
        type="checkbox"
        checked={state.matchMode}
        onChange={(e) =>
          dispatch({ type: "set-match-mode", matchMode: e.target.checked })
        }
        className="h-4 w-4 rounded border-border text-foreground focus:ring-zinc-900-600-800"
      />
      <span className="font-medium text-zinc-800">
        Match Mode
      </span>
      <span className="text-xs text-muted-foreground">
        only listings your cash + credit can actually get
      </span>
    </label>
  );
}
