import {
  makeFixtureMessage,
  makeFixtureMessageThread,
  type Message,
  type MessageThread,
  type ThreadKind,
} from "@/contracts";

export const listThreads = async (userId: string): Promise<MessageThread[]> => [
  makeFixtureMessageThread({ participants: [userId, "dealer_fixture"], kind: "buyer-dealer" }),
  makeFixtureMessageThread({ participants: [userId, "seller_fixture"], kind: "buyer-seller" }),
];

export const getThread = async (id: string): Promise<MessageThread | null> =>
  makeFixtureMessageThread({ id });

export const listMessages = async (threadId: string): Promise<Message[]> => [
  makeFixtureMessage({ threadId }),
  makeFixtureMessage({ threadId, senderId: "dealer_fixture", body: "Yes, still available." }),
];

export const sendMessage = async (input: {
  threadId: string;
  senderId: string;
  body: string;
  attachments?: string[];
}): Promise<Message> =>
  makeFixtureMessage({
    threadId: input.threadId,
    senderId: input.senderId,
    body: input.body,
    attachments: input.attachments,
  });

export const openOrCreateThread = async (input: {
  participants: string[];
  kind: ThreadKind;
  listingId?: string;
}): Promise<MessageThread> =>
  makeFixtureMessageThread({
    participants: input.participants,
    kind: input.kind,
    listingId: input.listingId,
  });

// Socket transport stub — real impl subscribes a websocket.
export type SocketHandle = { close: () => void };

export const subscribeThread = (
  threadId: string,
  onMessage: (message: Message) => void,
): SocketHandle => {
  const handle = setTimeout(() => {
    onMessage(makeFixtureMessage({ threadId, body: "(socket stub echo)" }));
  }, 500);
  return { close: () => clearTimeout(handle) };
};
