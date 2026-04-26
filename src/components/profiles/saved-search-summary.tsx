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
        <p className="text-sm text-muted-foreground">
          No saved search yet.
        </p>
        <Link
          href="/browse"
          className="text-sm font-medium text-foreground underline"
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
            className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground-800"
          >
            {p}
          </li>
        ))}
      </ul>
      <Link
        href="/browse"
        className="text-sm font-medium text-foreground underline"
      >
        Edit search
      </Link>
    </div>
  );
}
