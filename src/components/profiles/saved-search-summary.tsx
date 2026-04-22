"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { IntakeState } from "@/contracts";
import { loadPersistedIntake } from "@/lib/intake/persistence";

type Props = { userId: string };

const formatYearRange = (range: [number, number] | undefined): string | null =>
  range ? `${range[0]}–${range[1]}` : null;

const formatMileageMax = (n: number | undefined): string | null =>
  n != null ? `≤ ${n.toLocaleString()} mi` : null;

const formatTitlePref = (t: IntakeState["titlePreference"]): string =>
  t === "clean" ? "Clean only" : t === "rebuilt" ? "Rebuilt only" : "Clean + rebuilt";

const formatCredit = (s?: number, noCredit?: boolean): string =>
  noCredit ? "No credit" : s != null ? `Credit ${s}` : "Credit —";

const summarize = (s: IntakeState): string[] => {
  const parts: string[] = [];
  const ymm = [s.make, s.model].filter(Boolean).join(" ").trim();
  if (ymm) parts.push(ymm);
  const yr = formatYearRange(s.yearRange);
  if (yr) parts.push(yr);
  const ml = formatMileageMax(s.mileageMax);
  if (ml) parts.push(ml);
  parts.push(formatTitlePref(s.titlePreference));
  parts.push(formatCredit(s.creditScore, s.noCredit));
  parts.push(`Cash $${s.cash.toLocaleString()}`);
  if (s.matchMode) parts.push("Match mode");
  return parts;
};

export function SavedSearchSummary({ userId }: Props) {
  const [state, setState] = useState<IntakeState | null>(null);

  useEffect(() => {
    setState(loadPersistedIntake(userId));
  }, [userId]);

  if (state === null) {
    return (
      <div data-testid="saved-search-empty" className="space-y-1">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          No saved search yet.
        </p>
        <Link
          href="/search"
          className="text-sm font-medium text-zinc-900 underline dark:text-white"
        >
          Start a search
        </Link>
      </div>
    );
  }

  const parts = summarize(state);
  return (
    <div data-testid="saved-search" className="space-y-2">
      <ul className="flex flex-wrap gap-1.5">
        {parts.map((p) => (
          <li
            key={p}
            className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            {p}
          </li>
        ))}
      </ul>
      <Link
        href="/search"
        className="text-sm font-medium text-zinc-900 underline dark:text-white"
      >
        Edit search
      </Link>
    </div>
  );
}
