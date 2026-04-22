import { nextFixtureId, nowIso, type ISOTimestamp } from "./common";

export type ThreadKind = "buyer-seller" | "buyer-dealer" | "buyer-picknbuild";

export type MessageThread = {
  id: string;
  participants: string[];
  kind: ThreadKind;
  listingId?: string;
  lastMessageAt: ISOTimestamp;
};

export type Message = {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  attachments?: string[];
  sentAt: ISOTimestamp;
};

export const makeFixtureMessageThread = (
  overrides: Partial<MessageThread> = {},
): MessageThread => ({
  id: nextFixtureId("thread"),
  participants: ["user_fixture", "dealer_fixture"],
  kind: "buyer-dealer",
  lastMessageAt: nowIso(),
  ...overrides,
});

export const makeFixtureMessage = (overrides: Partial<Message> = {}): Message => ({
  id: nextFixtureId("msg"),
  threadId: "thread_fixture",
  senderId: "user_fixture",
  body: "Hi — is this still available?",
  sentAt: nowIso(),
  ...overrides,
});
