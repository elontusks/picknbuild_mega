import Link from "next/link";
import type { DealRecord } from "@/contracts";
import { humanizeDealStatus } from "@/lib/dashboard/status-labels";
import { formatDate } from "@/components/payments/format";

type Props = {
  currentDealId: string;
  deals: DealRecord[];
};

// Rendered only when the buyer has more than one DealRecord. Switching to a
// specific deal is a GET to /dashboard?dealId=... which re-runs the server
// loader through loadDashboard's ownership guard.
export function DealSwitcher({ currentDealId, deals }: Props) {
  if (deals.length === 0) return null;
  return (
    <nav
      data-testid="deal-switcher"
      aria-label="Other deals"
      className="rounded-lg border border-border bg-background p-3 text-sm-800-950"
    >
      <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
        Your deals
      </p>
      <ul className="space-y-1">
        {deals.map((deal) => (
          <li key={deal.id}>
            <Link
              data-testid="deal-switcher-link"
              data-current={deal.id === currentDealId ? "true" : "false"}
              href={`/dashboard?dealId=${encodeURIComponent(deal.id)}`}
              className={
                deal.id === currentDealId
                  ? "font-medium"
                  : "text-muted-foreground underline-offset-2 hover:underline"
              }
            >
              <span>
                {deal.committedSpec.makeModelYearRange || deal.id}
              </span>
              <span className="ml-2 text-xs text-muted-foreground">
                {humanizeDealStatus(deal.status)} · {formatDate(deal.createdAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
