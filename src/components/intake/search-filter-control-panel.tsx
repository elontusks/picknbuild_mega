"use client";

import { useCallback } from "react";
import { useIntakeDispatch, useIntakeState } from "@/lib/intake";

const CURRENT_YEAR = new Date().getFullYear();

export function SearchFilterControlPanel() {
  const state = useIntakeState();
  const dispatch = useIntakeDispatch();

  const onRange = useCallback(
    (which: "min" | "max", raw: string) => {
      const trimmed = raw.trim();
      const n = trimmed === "" ? undefined : Number(trimmed);
      if (n !== undefined && (!Number.isFinite(n) || n < 1900 || n > CURRENT_YEAR + 1))
        return;
      const current = state.yearRange ?? [1990, CURRENT_YEAR];
      if (n === undefined) {
        dispatch({ type: "set-year-range", yearRange: undefined });
        return;
      }
      const nextRange: [number, number] =
        which === "min"
          ? [Math.round(n), Math.max(Math.round(n), current[1])]
          : [Math.min(current[0], Math.round(n)), Math.round(n)];
      dispatch({ type: "set-year-range", yearRange: nextRange });
    },
    [dispatch, state.yearRange],
  );

  const onNumber = useCallback(
    (fn: (n?: number) => void, raw: string) => {
      const trimmed = raw.trim();
      if (trimmed === "") {
        fn(undefined);
        return;
      }
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n < 0) return;
      fn(Math.round(n));
    },
    [],
  );

  return (
    <div
      data-intake="search-filter-control-panel"
      className="grid gap-3 md:grid-cols-2 lg:grid-cols-4"
    >
      <Field label="Make">
        <input
          type="text"
          value={state.make ?? ""}
          onChange={(e) =>
            dispatch({ type: "set-make", make: e.target.value })
          }
          placeholder="e.g. Honda"
          className={INPUT_CLASS}
        />
      </Field>
      <Field label="Model">
        <input
          type="text"
          value={state.model ?? ""}
          onChange={(e) =>
            dispatch({ type: "set-model", model: e.target.value })
          }
          placeholder="e.g. Accord"
          className={INPUT_CLASS}
        />
      </Field>
      <Field label="Trim">
        <input
          type="text"
          value={state.trim ?? ""}
          onChange={(e) =>
            dispatch({ type: "set-trim", trim: e.target.value })
          }
          placeholder="optional"
          className={INPUT_CLASS}
        />
      </Field>
      <Field label="Max mileage">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          step={1000}
          value={state.mileageMax ?? ""}
          onChange={(e) =>
            onNumber(
              (n) => dispatch({ type: "set-mileage-max", mileageMax: n }),
              e.target.value,
            )
          }
          placeholder="e.g. 80000"
          className={INPUT_CLASS}
        />
      </Field>
      <Field label="Year from">
        <input
          type="number"
          inputMode="numeric"
          min={1900}
          max={CURRENT_YEAR + 1}
          value={state.yearRange?.[0] ?? ""}
          onChange={(e) => onRange("min", e.target.value)}
          placeholder="e.g. 2015"
          className={INPUT_CLASS}
        />
      </Field>
      <Field label="Year to">
        <input
          type="number"
          inputMode="numeric"
          min={1900}
          max={CURRENT_YEAR + 1}
          value={state.yearRange?.[1] ?? ""}
          onChange={(e) => onRange("max", e.target.value)}
          placeholder={String(CURRENT_YEAR)}
          className={INPUT_CLASS}
        />
      </Field>
      <Field label="Cash available">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          step={100}
          value={state.cash}
          onChange={(e) =>
            onNumber(
              (n) => dispatch({ type: "set-cash", cash: n ?? 0 }),
              e.target.value,
            )
          }
          className={INPUT_CLASS}
        />
      </Field>
      <Field label="ZIP">
        <input
          type="text"
          readOnly
          value={state.location.zip}
          aria-describedby="zip-helper"
          className={`${INPUT_CLASS} bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400`}
        />
        <p
          id="zip-helper"
          className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400"
        >
          Change in your profile.
        </p>
      </Field>
    </div>
  );
}

const INPUT_CLASS =
  "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      {children}
    </label>
  );
}
