import type { PaymentRecord } from "@/contracts";
import { formatDate, formatUsd, humanizeKind } from "./format";

type Props = { payment: PaymentRecord };

export function PaymentReceipt({ payment }: Props) {
  return (
    <section
      data-testid="payment-receipt"
      className="rounded-lg border border-border bg-background p-4 shadow-sm-800-950"
    >
      <header className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Receipt
        </h3>
        <span
          data-testid="payment-status"
          data-status={payment.status}
          className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground-800"
        >
          {payment.status}
        </span>
      </header>
      <dl className="grid grid-cols-2 gap-y-1 text-sm">
        <dt className="text-muted-foreground">Type</dt>
        <dd className="text-right">{humanizeKind(payment.kind)}</dd>
        <dt className="text-muted-foreground">Amount</dt>
        <dd className="text-right font-mono">{formatUsd(payment.amount)}</dd>
        <dt className="text-muted-foreground">Date</dt>
        <dd className="text-right">{formatDate(payment.createdAt)}</dd>
        <dt className="text-muted-foreground">Reference</dt>
        <dd
          className="text-right font-mono text-xs text-muted-foreground"
          data-testid="payment-mercury-ref"
        >
          {payment.mercuryRef}
        </dd>
      </dl>
    </section>
  );
}
