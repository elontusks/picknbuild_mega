import type { Subscription } from "@/services/team-14-payments";
import { formatDate, formatUsd } from "./format";

type Props = { subscription: Subscription | null };

const STATUS_LABEL: Record<Subscription["status"], string> = {
  active: "Active",
  past_due: "Past due",
  cancelled: "Cancelled",
  incomplete: "Incomplete",
};

export function SubscriptionStatusDisplay({ subscription }: Props) {
  if (!subscription) {
    return (
      <p
        data-testid="subscription-status-empty"
        className="text-sm text-zinc-500"
      >
        No active dealer subscription.
      </p>
    );
  }
  const { status, plan, amountUsd, currentPeriodEnd, cancelAtPeriodEnd } =
    subscription;
  return (
    <section
      data-testid="subscription-status"
      data-status={status}
      className="rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <header className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold capitalize">
          {plan.replace("dealer-", "Dealer ")} plan
        </h3>
        <span
          className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          data-testid="subscription-status-label"
        >
          {STATUS_LABEL[status]}
        </span>
      </header>
      <p className="text-zinc-500">
        <span className="font-mono text-zinc-700 dark:text-zinc-200">
          {formatUsd(amountUsd)}
        </span>{" "}
        / month
      </p>
      <p className="text-zinc-500">
        {cancelAtPeriodEnd ? "Ends" : "Renews"} on{" "}
        <strong className="text-zinc-700 dark:text-zinc-200">
          {formatDate(currentPeriodEnd)}
        </strong>
      </p>
    </section>
  );
}
