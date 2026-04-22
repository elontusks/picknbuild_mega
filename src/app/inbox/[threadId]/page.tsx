import { notFound, redirect } from "next/navigation";
import { loadPrincipal } from "@/lib/authz/server/principal-loader";
import { getThread, listMessages } from "@/services/team-13-messaging";
import { ChatWindow } from "@/components/messaging/chat-window";

export const dynamic = "force-dynamic";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const principal = await loadPrincipal();
  if (!principal) redirect(`/login?next=/inbox/${threadId}`);
  const thread = await getThread(threadId);
  if (!thread) notFound();
  if (!thread.participants.includes(principal.id)) notFound();
  const messages = await listMessages(threadId, { limit: 100 });
  return (
    <main className="mx-auto flex h-[calc(100vh-4rem)] w-full max-w-2xl flex-col p-4">
      <ChatWindow
        thread={thread}
        messages={messages}
        currentUserId={principal.id}
      />
    </main>
  );
}
