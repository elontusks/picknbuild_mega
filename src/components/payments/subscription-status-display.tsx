import type { Subscription } from "@/services/team-14-payments";
import { formatDate, formatUsd } from "./format";

type Props = { subscription: Subscription | null };

const STATUS_LABEL: Record<Subscription["status"], string> = {
  active: "Active",
  past_due: "Past due",
  cancelled: "Cancelled",
};

export function SubscriptionStatusDisplay({ subscription }: Props) {
  if (!subscription) {
    return (
      <p
        data-testid="subscription-status-empty"
        className="text-sm text-muted-foreground"
      >
        No active dealer subscription.
      </p>
    );
  }
  const { status, plan, amountUsd, currentPeriodEnd } = subscription;
  return (
    <section
      data-testid="subscription-status"
      data-status={status}
      className="rounded-lg border border-border bg-background p-4 text-sm-800-950"
    >
      <header className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold capitalize">
          {plan.replace("dealer-", "Dealer ")} plan
        </h3>
        <span
          className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground-800"
          data-testid="subscription-status-label"
        >
          {STATUS_LABEL[status]}
        </span>
      </header>
      <p className="text-muted-foreground">
        <span className="font-mono text-muted-foreground">
          {formatUsd(amountUsd)}
        </span>{" "}
        / month
      </p>
      <p className="text-muted-foreground">
        {status === "cancelled" ? "Ended" : "Renews"} on{" "}
        <strong className="text-muted-foreground">
          {formatDate(currentPeriodEnd)}
        </strong>
      </p>
    </section>
  );
}
