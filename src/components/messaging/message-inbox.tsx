import type { MessageThread } from "@/contracts";
import { ThreadListItem } from "./thread-list-item";

export function MessageInbox({
  threads,
  currentUserId,
}: {
  threads: MessageThread[];
  currentUserId: string;
}) {
  if (threads.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="inbox-empty">
        No conversations yet. Open one from a listing, a dealer page, or your
        garage.
      </p>
    );
  }
  return (
    <ul
      className="flex flex-col gap-2"
      data-testid="message-inbox"
      aria-label="Message inbox"
    >
      {threads.map((t) => (
        <li key={t.id}>
          <ThreadListItem thread={t} currentUserId={currentUserId} />
        </li>
      ))}
    </ul>
  );
}
