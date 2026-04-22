import type { PaymentRecord } from "@/contracts";
import { formatDate, formatUsd, humanizeKind } from "./format";

type Props = { payment: PaymentRecord };

export function PaymentReceipt({ payment }: Props) {
  return (
    <section
      data-testid="payment-receipt"
      className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <header className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Receipt
        </h3>
        <span
          data-testid="payment-status"
          data-status={payment.status}
          className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium capitalize text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
        >
          {payment.status}
        </span>
      </header>
      <dl className="grid grid-cols-2 gap-y-1 text-sm">
        <dt className="text-zinc-500">Type</dt>
        <dd className="text-right">{humanizeKind(payment.kind)}</dd>
        <dt className="text-zinc-500">Amount</dt>
        <dd className="text-right font-mono">{formatUsd(payment.amount)}</dd>
        <dt className="text-zinc-500">Date</dt>
        <dd className="text-right">{formatDate(payment.createdAt)}</dd>
        <dt className="text-zinc-500">Reference</dt>
        <dd
          className="text-right font-mono text-xs text-zinc-500"
          data-testid="payment-stripe-ref"
        >
          {payment.stripeRef}
        </dd>
      </dl>
    </section>
  );
}
