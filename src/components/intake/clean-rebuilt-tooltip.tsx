"use client";

import { useState } from "react";
import { getDisclaimer } from "@/lib/legal/disclaimers";

export function CleanRebuiltTooltip() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        aria-expanded={open}
        aria-label="What is clean vs rebuilt?"
        data-intake="clean-rebuilt-tooltip-trigger"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border text-[10px] font-semibold text-muted-foreground hover:bg-muted-600 dark:hover:bg-muted"
      >
        ?
      </button>
      {open ? (
        <div
          role="tooltip"
          data-intake="clean-rebuilt-tooltip"
          className="absolute left-6 top-0 z-20 w-72 rounded-lg border border-border bg-background p-3 text-xs leading-5 text-muted-foreground shadow-lg-700-900"
        >
          {getDisclaimer("clean-vs-rebuilt")}
        </div>
      ) : null}
    </div>
  );
}
