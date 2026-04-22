import type { Notification } from "@/contracts";

export type DigestSection = {
  category: Notification["category"];
  count: number;
  items: Notification[];
};

export type DigestPayload = {
  userId: string;
  generatedAt: string;
  sections: DigestSection[];
  subject: string;
  text: string;
};

// Groups notifications by category (most recent first within each section)
// and flattens into a subject + plain-text body suitable for email-client.
export const assembleDigest = (input: {
  userId: string;
  notifications: Notification[];
  now?: Date;
}): DigestPayload => {
  const now = input.now ?? new Date();
  const byCategory = new Map<Notification["category"], Notification[]>();
  for (const n of input.notifications) {
    const existing = byCategory.get(n.category) ?? [];
    existing.push(n);
    byCategory.set(n.category, existing);
  }
  const sections: DigestSection[] = Array.from(byCategory.entries())
    .map(([category, items]) => ({
      category,
      count: items.length,
      items: items
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    }))
    .sort((a, b) => b.count - a.count);

  const total = input.notifications.length;
  // sendDigest short-circuits on empty input before sending, so only the
  // non-empty subject line ever hits an inbox. The assembler still
  // returns a valid payload for the empty case (empty sections, empty
  // text) so callers that render a preview don't have to special-case.
  const subject = `Your PicknBuild digest — ${total} update${total === 1 ? "" : "s"}`;
  const text = sections
    .map((s) => {
      const header = `${s.category} (${s.count})`;
      const lines = s.items
        .slice(0, 5)
        .map((item) => {
          const payload = item.payload as { title?: string } | null;
          const title = payload?.title ?? JSON.stringify(item.payload);
          return `  - ${title}`;
        })
        .join("\n");
      return `${header}\n${lines}`;
    })
    .join("\n\n");

  return {
    userId: input.userId,
    generatedAt: now.toISOString(),
    sections,
    subject,
    text,
  };
};
