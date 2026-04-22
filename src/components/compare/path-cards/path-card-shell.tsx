"use client";

import type { ReactNode } from "react";
import type { PathKind } from "@/contracts";
import { BestFitBadge } from "../badges";
import { PATH_SUBTITLE, PATH_TITLE } from "@/lib/compare/formatters";

type Props = {
  path: PathKind;
  isBestFit?: boolean;
  headline: string;
  barrierLine: string;
  badges: ReactNode;
  body?: ReactNode;
  actions?: ReactNode;
  extras?: ReactNode;
};

export function PathCardShell({
  path,
  isBestFit,
  headline,
  barrierLine,
  badges,
  body,
  actions,
  extras,
}: Props) {
  return (
    <article
      data-testid={`path-card-${path}`}
      data-path={path}
      data-best-fit={isBestFit ? "true" : "false"}
      aria-label={`${PATH_TITLE[path]} path`}
      className={`flex flex-col gap-2 rounded-xl border p-3 ${
        isBestFit
          ? "border-emerald-400 bg-emerald-50 dark:border-emerald-500/60 dark:bg-emerald-950/30"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
      }`}
    >
      <header className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
            {PATH_TITLE[path]}
          </h3>
          <p className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {PATH_SUBTITLE[path]}
          </p>
        </div>
        {isBestFit ? <BestFitBadge /> : null}
      </header>
      <div className="flex flex-wrap gap-1">{badges}</div>
      <p
        className="text-sm font-medium text-zinc-900 dark:text-white"
        data-testid={`path-card-${path}-headline`}
      >
        {headline}
      </p>
      {body}
      <p
        data-testid={`path-card-${path}-barrier`}
        className="text-xs leading-5 text-zinc-600 dark:text-zinc-300"
      >
        {barrierLine}
      </p>
      {extras}
      {actions ? <div className="pt-1">{actions}</div> : null}
    </article>
  );
}
