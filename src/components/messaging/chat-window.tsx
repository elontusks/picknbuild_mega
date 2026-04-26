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
      <header className="border-b border-border pb-2-800">
        <h2 className="text-sm font-medium text-foreground">
          {kindTitle[thread.kind]}
        </h2>
        {thread.listingId ? (
          <p className="text-xs text-muted-foreground">
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
