import Link from "next/link";
import { Messaging } from "@/services";

type Props = { userId: string };

/**
 * Mount point for Team 13's inbox. Same swap-on-merge pattern as the bell —
 * the service stub returns fixture threads today.
 */
export async function InboxEntry({ userId }: Props) {
  const threads = await Messaging.listThreads(userId);
  const count = threads.length;
  return (
    <Link
      href="/inbox"
      aria-label={`Inbox (${count} threads)`}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
      data-shell-slot="inbox-entry"
    >
      <span aria-hidden="true">✉️</span>
      {count > 0 ? (
        <span
          data-testid="inbox-count"
          className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold leading-none text-white"
        >
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
