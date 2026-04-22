import type { PaymentRecord } from "@/contracts";
import { formatDate, formatUsd } from "./format";

type Props = { refunds: PaymentRecord[] };

export function RefundStatusDisplay({ refunds }: Props) {
  if (refunds.length === 0) {
    return (
      <p
        data-testid="refund-status-empty"
        className="text-sm text-zinc-500"
      >
        No refunds on file.
      </p>
    );
  }
  return (
    <ul
      data-testid="refund-status-list"
      className="divide-y divide-zinc-200 rounded-md border border-zinc-200 text-sm dark:divide-zinc-800 dark:border-zinc-800"
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
            <span className="text-zinc-500">refunded</span>
          </span>
          <span className="text-xs text-zinc-500">
            {formatDate(r.createdAt)}
          </span>
          <span
            data-testid={`refund-status-${r.id}`}
            className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs capitalize text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            {r.status}
          </span>
        </li>
      ))}
    </ul>
  );
}
