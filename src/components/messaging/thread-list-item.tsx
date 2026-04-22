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
      className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 bg-white px-3 py-2 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
    >
      <div className="flex flex-col">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {kindLabel[thread.kind]} · {other}
        </span>
        {thread.listingId ? (
          <span className="text-xs text-zinc-500">
            Re: listing {thread.listingId}
          </span>
        ) : null}
      </div>
      <time
        className="text-xs text-zinc-500"
        dateTime={thread.lastMessageAt}
      >
        {new Date(thread.lastMessageAt).toLocaleString()}
      </time>
    </Link>
  );
}
