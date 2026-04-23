import type { DealTimelineEntry } from "@/contracts";
import { formatDate } from "@/components/payments/format";
import { humanizeDealStatus } from "@/lib/dashboard/status-labels";
import type { DealStatus } from "@/contracts";

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
      className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <header className="mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
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
            <time className="text-xs text-zinc-500">
              {formatDate(entry.occurredAt)}
            </time>
          </li>
        ))}
      </ol>
    </section>
  );
}

const DEAL_STATUSES: DealStatus[] = [
  "build-started",
  "sourcing",
  "purchased",
  "in-transit",
  "delivered",
  "surrendered",
  "cancelled",
];

const labelForStage = (stage: string): string =>
  (DEAL_STATUSES as string[]).includes(stage)
    ? humanizeDealStatus(stage as DealStatus)
    : stage;
