import type { Message, MessageThread } from "@/contracts";
import { MessageHistoryDisplay } from "./message-history";
import { MessageComposer } from "./message-composer";

const kindTitle: Record<MessageThread["kind"], string> = {
  "buyer-seller": "Chat with private seller",
  "buyer-dealer": "Chat with dealer",
  "buyer-picknbuild": "picknbuild team",
};

export function ChatWindow({
  thread,
  messages,
  currentUserId,
}: {
  thread: MessageThread;
  messages: Message[];
  currentUserId: string;
}) {
  return (
    <section
      className="flex h-full flex-col gap-2"
      data-testid="chat-window"
      aria-label="Chat window"
    >
      <header className="border-b border-zinc-200 pb-2 dark:border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {kindTitle[thread.kind]}
        </h2>
        {thread.listingId ? (
          <p className="text-xs text-zinc-500">
            Listing: {thread.listingId}
          </p>
        ) : null}
      </header>
      <div className="flex-1 overflow-y-auto">
        <MessageHistoryDisplay
          messages={messages}
          currentUserId={currentUserId}
        />
      </div>
      <MessageComposer threadId={thread.id} />
    </section>
  );
}
