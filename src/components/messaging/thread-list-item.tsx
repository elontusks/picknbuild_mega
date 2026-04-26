import Link from "next/link";
import type { MessageThread } from "@/contracts";

const kindLabel: Record<MessageThread["kind"], string> = {
  "buyer-seller": "Private seller",
  "buyer-dealer": "Dealer",
  "buyer-picknbuild": "picknbuild team",
};

export function ThreadListItem({
  thread,
  currentUserId,
}: {
  thread: MessageThread;
  currentUserId: string;
}) {
  const other = thread.participants.find((p) => p !== currentUserId) ?? "—";
  return (
    <Link
      href={`/inbox/${thread.id}`}
      data-testid="thread-list-item"
      className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 hover:bg-background-800-950 dark:hover:bg-muted"
    >
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">
          {kindLabel[thread.kind]} · {other}
        </span>
        {thread.listingId ? (
          <span className="text-xs text-muted-foreground">
            Re: listing {thread.listingId}
          </span>
        ) : null}
      </div>
      <time
        className="text-xs text-muted-foreground"
        dateTime={thread.lastMessageAt}
      >
        {new Date(thread.lastMessageAt).toLocaleString()}
      </time>
    </Link>
  );
}
