import type { DealRecord } from "@/contracts";
import { formatDate, formatUsd } from "@/components/payments/format";

type Props = {
  deal: DealRecord;
};

export function DashboardSummary({ deal }: Props) {
  return (
    <section
      data-testid="dashboard-summary"
      className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Deal</p>
          <h1 className="text-lg font-semibold">
            {deal.committedSpec.makeModelYearRange || "picknbuild build"}
          </h1>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Package</p>
          <p className="text-sm font-medium capitalize">{deal.package}</p>
        </div>
      </header>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm md:grid-cols-4">
        <dt className="text-zinc-500">Total</dt>
        <dd className="font-mono">{formatUsd(deal.pricing.total)}</dd>
        <dt className="text-zinc-500">Down</dt>
        <dd className="font-mono">{formatUsd(deal.pricing.down)}</dd>
        <dt className="text-zinc-500">Bi-weekly</dt>
        <dd className="font-mono">{formatUsd(deal.pricing.biweekly)}</dd>
        <dt className="text-zinc-500">Term</dt>
        <dd>{deal.pricing.term}</dd>
        <dt className="text-zinc-500">Started</dt>
        <dd>{formatDate(deal.createdAt)}</dd>
        <dt className="text-zinc-500">Title</dt>
        <dd className="capitalize">{deal.committedSpec.titleType}</dd>
      </dl>
    </section>
  );
}
