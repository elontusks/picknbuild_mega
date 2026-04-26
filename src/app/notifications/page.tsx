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
    <main style={{ minHeight: '100vh', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0', color: 'var(--foreground)' }}>
              Notifications
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: 0 }}>Stay updated on messages, deals, and payments</p>
          </div>
          <NotificationHistoryDisplay notifications={notifications} />
        </section>
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '16px', backgroundColor: 'var(--card)', borderRadius: '8px', border: `1px solid var(--border)` }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 16px 0', color: 'var(--foreground)' }}>
              Preferences
            </h2>
            <NotificationPreferencesPanel initial={preferences} />
          </div>
        </aside>
      </div>
    </main>
  );
}
