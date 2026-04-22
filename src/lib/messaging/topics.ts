// Conventions for realtime topic names so publishers and subscribers on
// different surfaces agree without a second source of truth.

export const threadTopic = (threadId: string): string => `thread:${threadId}`;
export const userNotificationsTopic = (userId: string): string =>
  `user-notifications:${userId}`;

export const EVENTS = {
  messageSent: "message.sent",
  notificationEmitted: "notification.emitted",
} as const;
