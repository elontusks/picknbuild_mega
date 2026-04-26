import type { Message } from "@/contracts";

export function MessageHistoryDisplay({
  messages,
  currentUserId,
}: {
  messages: Message[];
  currentUserId: string;
}) {
  if (messages.length === 0) {
    return (
      <p
        className="text-sm text-muted-foreground"
        data-testid="message-history-empty"
      >
        No messages yet — say hi.
      </p>
    );
  }
  return (
    <ol
      className="flex flex-col gap-2"
      data-testid="message-history"
      aria-label="Message history"
    >
      {messages.map((m) => {
        const mine = m.senderId === currentUserId;
        return (
          <li
            key={m.id}
            data-testid="message"
            className={`flex ${mine ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                mine
                  ? "bg-blue-600 text-primary-foreground"
                  : "bg-muted text-foreground-800"
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{m.body}</p>
              <time
                className={`mt-1 block text-[10px] ${
                  mine ? "text-blue-100" : "text-muted-foreground"
                }`}
                dateTime={m.sentAt}
              >
                {new Date(m.sentAt).toLocaleTimeString()}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
