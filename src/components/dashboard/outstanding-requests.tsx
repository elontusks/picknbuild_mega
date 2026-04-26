import { formatDate } from "@/components/payments/format";
import type { DealRequest } from "@/lib/deal-requests/types";

type Props = {
  requests: DealRequest[];
};

const KIND_LABEL: Record<DealRequest["kind"], string> = {
  upgrade: "Upgrade",
  downgrade: "Downgrade",
  surrender: "Voluntary surrender",
};

// Surfaces pending upgrade/downgrade/surrender requests the buyer has filed
// against this deal so they can see what is open instead of re-filing.
export function OutstandingRequests({ requests }: Props) {
  if (requests.length === 0) return null;
  return (
    <section
      data-testid="outstanding-requests"
      className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm-900/40-950/20"
    >
      <header className="mb-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
          Outstanding requests
        </h2>
      </header>
      <ul className="space-y-1">
        {requests.map((r) => (
          <li
            key={r.id}
            data-testid="outstanding-request-row"
            data-kind={r.kind}
            data-status={r.status}
            className="flex items-baseline justify-between gap-3"
          >
            <span>
              <span className="font-medium">{KIND_LABEL[r.kind]}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {r.reason}
              </span>
            </span>
            <span className="text-xs text-muted-foreground">
              {r.status} · {formatDate(r.createdAt)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
