import type { PaymentRecord } from "@/contracts";
import { formatDate, formatUsd } from "./format";

type Props = { refunds: PaymentRecord[] };

export function RefundStatusDisplay({ refunds }: Props) {
  if (refunds.length === 0) {
    return (
      <p
        data-testid="refund-status-empty"
        className="text-sm text-muted-foreground"
      >
        No refunds on file.
      </p>
    );
  }
  return (
    <ul
      data-testid="refund-status-list"
      className="divide-y divide-zinc-200 rounded-md border border-border text-sm dark:divide-zinc-800-800"
    >
      {refunds.map((r) => (
        <li
          key={r.id}
          data-testid={`refund-row-${r.id}`}
          data-status={r.status}
          className="flex items-center justify-between gap-3 p-3"
        >
          <span>
            <strong className="font-mono">{formatUsd(r.amount)}</strong>{" "}
            <span className="text-muted-foreground">refunded</span>
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDate(r.createdAt)}
          </span>
          <span
            data-testid={`refund-status-${r.id}`}
            className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground-800"
          >
            {r.status}
          </span>
        </li>
      ))}
    </ul>
  );
}
