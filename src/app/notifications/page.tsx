import { redirect } from "next/navigation";
import { loadPrincipal } from "@/lib/authz/server/principal-loader";
import {
  getPreferences,
  listNotifications,
} from "@/services/team-13-notifications";
import { NotificationHistoryDisplay } from "@/components/notifications/notification-history";
import { NotificationPreferencesPanel } from "@/components/notifications/notification-preferences-panel";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const principal = await loadPrincipal();
  if (!principal) redirect("/login?next=/notifications");
  const [notifications, preferences] = await Promise.all([
    listNotifications(principal.id),
    getPreferences(principal.id),
  ]);
  return (
    <main className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-6 p-4 md:grid-cols-[2fr_1fr]">
      <section className="flex flex-col gap-3">
        <h1 className="text-lg font-semibold text-foreground">
          Notifications
        </h1>
        <NotificationHistoryDisplay notifications={notifications} />
      </section>
      <aside className="flex flex-col gap-3 border-t border-border pt-4 md:border-l md:border-t-0 md:pl-4 md:pt-0-800">
        <h2 className="text-sm font-semibold text-foreground">
          Preferences
        </h2>
        <NotificationPreferencesPanel initial={preferences} />
      </aside>
    </main>
  );
}
