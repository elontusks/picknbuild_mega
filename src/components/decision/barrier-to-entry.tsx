import type { PathKind } from "@/contracts";

type Props = {
  path: PathKind;
  line: string;
};

/**
 * One-line "what this path really requires" render. Reads `barrierLine`
 * verbatim from `PathQuote` (ch/09) so copy always matches the pricing
 * source of truth.
 */
export function BarrierToEntryLine({ path, line }: Props) {
  return (
    <p
      data-testid={`barrier-line-${path}`}
      data-decision="barrier-to-entry"
      className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs leading-5 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
    >
      <span className="font-semibold uppercase tracking-wide text-[10px] text-zinc-500 dark:text-zinc-400">
        Barrier to entry
      </span>
      <br />
      {line}
    </p>
  );
}
