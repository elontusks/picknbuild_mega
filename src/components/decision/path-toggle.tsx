"use client";

import type { PathKind, PathQuote } from "@/contracts";

const PATH_ORDER: PathKind[] = ["dealer", "picknbuild", "auction", "private"];

const PATH_LABEL: Record<PathKind, string> = {
  dealer: "Dealer",
  picknbuild: "picknbuild",
  auction: "Auction",
  private: "Private",
};

type Props = {
  activePath: PathKind;
  quotes: PathQuote[];
  onChange: (p: PathKind) => void;
  autoCycleStopped: boolean;
};

/**
 * Path Toggle (Gap View) — tabs across the top of See Where You Stand. Emits
 * the new active path; the container freezes auto-cycle on user click so the
 * panel stays on the user's pick (ch/08).
 */
export function PathToggleGapView({
  activePath,
  quotes,
  onChange,
  autoCycleStopped,
}: Props) {
  const available = new Set(quotes.map((q) => q.path));
  return (
    <div
      data-decision="path-toggle"
      data-testid="path-toggle"
      data-auto-cycle-stopped={autoCycleStopped ? "true" : "false"}
      role="tablist"
      aria-label="Active path"
      className="inline-flex flex-wrap gap-1 rounded-lg border border-border bg-background p-1-800-950"
    >
      {PATH_ORDER.filter((p) => available.has(p)).map((p) => {
        const isActive = p === activePath;
        return (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={isActive}
            data-testid={`path-tab-${p}`}
            onClick={() => onChange(p)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? "bg-muted text-primary-foreground"
                : "text-muted-foreground hover:bg-muted dark:hover:bg-muted"
            }`}
          >
            {PATH_LABEL[p]}
          </button>
        );
      })}
    </div>
  );
}
