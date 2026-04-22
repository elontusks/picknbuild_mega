import type { Notification } from "@/contracts";

const categoryLabel: Record<Notification["category"], string> = {
  message: "Message",
  "price-change": "Price change",
  "dealer-response": "Dealer",
  payment: "Payment",
  "deal-status": "Deal status",
  system: "System",
};

export function NotificationHistoryDisplay({
  notifications,
}: {
  notifications: Notification[];
}) {
  if (notifications.length === 0) {
    return (
      <p
        className="text-sm text-zinc-500"
        data-testid="notifications-empty"
      >
        No notifications yet.
      </p>
    );
  }
  return (
    <ul
      className="flex flex-col gap-2"
      data-testid="notification-history"
      aria-label="Notification history"
    >
      {notifications.map((n) => {
        const payload = n.payload as { title?: string } | null;
        return (
          <li
            key={n.id}
            data-testid="notification-item"
            data-category={n.category}
            data-channel={n.channel}
            data-read={n.readAt ? "true" : "false"}
            className={`flex items-start justify-between gap-3 rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-800 ${
              n.readAt
                ? "bg-white dark:bg-zinc-950"
                : "bg-blue-50 dark:bg-blue-950"
            }`}
          >
            <div className="flex flex-col">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {categoryLabel[n.category]} · {n.channel}
              </span>
              <span className="text-sm text-zinc-900 dark:text-zinc-100">
                {payload?.title ?? JSON.stringify(n.payload)}
              </span>
            </div>
            <time
              className="text-xs text-zinc-500"
              dateTime={n.createdAt}
            >
              {new Date(n.createdAt).toLocaleString()}
            </time>
          </li>
        );
      })}
    </ul>
  );
}
