import Link from "next/link";
import { Notifications } from "@/services";

type Props = { userId: string };

/**
 * Mount point for Team 13's bell. Team 1 owns the slot in the shell; the
 * service stub from `@/services/team-13-notifications` returns fixtures
 * today and will return real `Notification` rows once Team 13 merges with
 * no change to this component.
 */
export async function NotificationBell({ userId }: Props) {
  const notifications = await Notifications.listNotifications(userId);
  const unread = notifications.filter((n) => !n.readAt).length;
  return (
    <Link
      href="/notifications"
      aria-label={`Notifications (${unread} unread)`}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted dark:hover:bg-muted"
      data-shell-slot="notification-bell"
    >
      <span aria-hidden="true">🔔</span>
      {unread > 0 ? (
        <span
          data-testid="bell-unread"
          className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-primary-foreground"
        >
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
