import type { ReactNode } from "react";
import { loadSession } from "@/services/team-01-auth";
import { Header } from "./header";
import { NotificationBell } from "./notification-bell";
import { InboxEntry } from "./inbox-entry";
import { MobileNavBar } from "./mobile-nav-bar";

type GlobalShellProps = {
  children: ReactNode;
};

/**
 * App-wide shell. Renders the header (with Team 13 bell + inbox mount points
 * when a User is present), the main content slot, and the mobile nav bar
 * pinned to the bottom on small viewports.
 *
 * Unauthenticated requests still see the shell so /login and /signup are
 * framed consistently; the bell and inbox simply don't render.
 */
export async function GlobalShell({ children }: GlobalShellProps) {
  const session = await loadSession();
  const user = session.state === "ready" ? session.user : null;

  return (
    <div className="flex min-h-full flex-col bg-zinc-50 dark:bg-black">
      <Header
        user={user}
        bellSlot={user ? <NotificationBell userId={user.id} /> : null}
        inboxSlot={user ? <InboxEntry userId={user.id} /> : null}
      />
      <main className="flex-1">{children}</main>
      {user ? <MobileNavBar /> : null}
    </div>
  );
}
