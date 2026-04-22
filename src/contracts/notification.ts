import { nextFixtureId, nowIso, type ISOTimestamp } from "./common";

export type NotificationCategory =
  | "message"
  | "price-change"
  | "dealer-response"
  | "payment"
  | "deal-status"
  | "system";

export type NotificationChannel = "in-app" | "email" | "digest";

export type Notification = {
  id: string;
  userId: string;
  category: NotificationCategory;
  payload: unknown;
  channel: NotificationChannel;
  createdAt: ISOTimestamp;
  readAt?: ISOTimestamp;
};

export const makeFixtureNotification = (
  overrides: Partial<Notification> = {},
): Notification => ({
  id: nextFixtureId("notif"),
  userId: "user_fixture",
  category: "system",
  payload: { title: "Welcome to PicknBuild" },
  channel: "in-app",
  createdAt: nowIso(),
  ...overrides,
});
