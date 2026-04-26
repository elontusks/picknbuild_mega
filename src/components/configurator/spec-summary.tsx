"use client";

type Props = { summary: string };

export function SpecSummary({ summary }: Props) {
  return (
    <section
      data-testid="spec-summary"
      className="space-y-2 rounded-lg border border-border bg-background p-4-800-950"
    >
      <h3 className="text-sm font-semibold">Commitment Summary</h3>
      <pre
        data-testid="spec-summary-body"
        className="whitespace-pre-wrap break-words font-mono text-xs text-zinc-800"
      >
        {summary}
      </pre>
      <p className="text-[11px] text-muted-foreground">
        This is the exact description that prints on your signed agreement.
      </p>
    </section>
  );
}
