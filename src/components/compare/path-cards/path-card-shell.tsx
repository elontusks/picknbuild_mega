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
          ? "border-emerald-400 bg-emerald-50-500/60-950/30"
          : "border-border bg-white-800-950"
      }`}
    >
      <header className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {PATH_TITLE[path]}
          </h3>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {PATH_SUBTITLE[path]}
          </p>
        </div>
        {isBestFit ? <BestFitBadge /> : null}
      </header>
      <div className="flex flex-wrap gap-1">{badges}</div>
      <p
        className="text-sm font-medium text-foreground"
        data-testid={`path-card-${path}-headline`}
      >
        {headline}
      </p>
      {body}
      <p
        data-testid={`path-card-${path}-barrier`}
        className="text-xs leading-5 text-muted-foreground"
      >
        {barrierLine}
      </p>
      {extras}
      {actions ? <div className="pt-1">{actions}</div> : null}
    </article>
  );
}
