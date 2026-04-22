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
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-[10px] font-semibold text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        ?
      </button>
      {open ? (
        <div
          role="tooltip"
          data-intake="clean-rebuilt-tooltip"
          className="absolute left-6 top-0 z-20 w-72 rounded-lg border border-zinc-200 bg-white p-3 text-xs leading-5 text-zinc-700 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        >
          {getDisclaimer("clean-vs-rebuilt")}
        </div>
      ) : null}
    </div>
  );
}
