import type { PaymentRecord } from "@/contracts";
import {
  formatDate,
  formatUsd,
  humanizeKind,
} from "@/components/payments/format";

type Props = {
  payments: PaymentRecord[];
};

// Payment History View — flat list of PaymentRecords already scoped to the
// current deal by the dashboard loader. Refunds and balance payments render
// alongside the original deposit so the buyer sees a single ledger.
// Sort is newest-first; callers can hand over any order since we re-sort
// defensively here.
export function PaymentHistoryView({ payments }: Props) {
  const sorted = [...payments].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  return (
    <section
      data-testid="payment-history"
      className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <header className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Payment history
        </h2>
        <span className="text-xs text-zinc-500">
          {sorted.length} {sorted.length === 1 ? "entry" : "entries"}
        </span>
      </header>
      {sorted.length === 0 ? (
        <p
          data-testid="payment-history-empty"
          className="text-sm text-zinc-500"
        >
          No payments recorded yet for this deal.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {sorted.map((payment) => (
            <li
              key={payment.id}
              data-testid="payment-history-row"
              data-kind={payment.kind}
              data-status={payment.status}
              className="flex items-baseline justify-between gap-3 py-2 text-sm"
            >
              <div>
                <div className="font-medium">{humanizeKind(payment.kind)}</div>
                <div className="text-xs text-zinc-500">
                  {formatDate(payment.createdAt)} · {payment.status}
                </div>
              </div>
              <div
                className={`font-mono ${
                  payment.kind === "refund"
                    ? "text-emerald-600"
                    : "text-zinc-900 dark:text-zinc-100"
                }`}
              >
                {payment.kind === "refund" ? "-" : ""}
                {formatUsd(payment.amount)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
