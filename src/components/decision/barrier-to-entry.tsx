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
      className="rounded-lg border border-border bg-background px-3 py-2 text-xs leading-5 text-muted-foreground-800-900"
    >
      <span className="font-semibold uppercase tracking-wide text-[10px] text-muted-foreground">
        Barrier to entry
      </span>
      <br />
      {line}
    </p>
  );
}
