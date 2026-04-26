import { redirect } from "next/navigation";
import { loadPrincipal } from "@/lib/authz/server/principal-loader";
import { listThreads } from "@/services/team-13-messaging";
import { MessageInbox } from "@/components/messaging/message-inbox";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const principal = await loadPrincipal();
  if (!principal) redirect("/login?next=/inbox");
  const threads = await listThreads(principal.id);
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold text-foreground">
        Inbox
      </h1>
      <MessageInbox threads={threads} currentUserId={principal.id} />
    </main>
  );
}
