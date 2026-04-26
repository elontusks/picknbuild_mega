import type { DealStatus, DealTimelineEntry } from "@/contracts";
import { formatDate } from "@/components/payments/format";
import {
  DEAL_STATUSES,
  humanizeDealStatus,
} from "@/lib/dashboard/status-labels";

type Props = {
  timeline: DealTimelineEntry[];
};

// Renders every DealRecord.timeline entry in occurredAt order. The stage
// string is compared against the DealStatus vocabulary to reuse the shared
// humanized label; unrecognized stages fall through verbatim so future
// Team 12 stages still render without code churn here.
export function StatusTimeline({ timeline }: Props) {
  const sorted = [...timeline].sort((a, b) =>
    a.occurredAt.localeCompare(b.occurredAt),
  );
  return (
    <section
      data-testid="status-timeline"
      className="rounded-lg border border-border bg-background p-4-800-950"
    >
      <header className="mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Status timeline
        </h2>
      </header>
      <ol className="space-y-2">
        {sorted.map((entry, i) => (
          <li
            key={`${entry.occurredAt}-${entry.stage}-${i}`}
            data-testid="status-timeline-entry"
            data-stage={entry.stage}
            className="flex items-baseline justify-between gap-3 text-sm"
          >
            <span className="font-medium">
              {labelForStage(entry.stage)}
            </span>
            <time className="text-xs text-muted-foreground">
              {formatDate(entry.occurredAt)}
            </time>
          </li>
        ))}
      </ol>
    </section>
  );
}

const labelForStage = (stage: string): string =>
  (DEAL_STATUSES as string[]).includes(stage)
    ? humanizeDealStatus(stage as DealStatus)
    : stage;
