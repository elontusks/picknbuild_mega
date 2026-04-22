import {
  makeFixtureNotification,
  type Notification,
  type NotificationCategory,
  type NotificationChannel,
} from "@/contracts";

export const listNotifications = async (
  userId: string,
): Promise<Notification[]> => [
  makeFixtureNotification({ userId, category: "message" }),
  makeFixtureNotification({ userId, category: "price-change" }),
  makeFixtureNotification({ userId, category: "system" }),
];

export const emitNotification = async (input: {
  userId: string;
  category: NotificationCategory;
  payload: unknown;
  channels?: NotificationChannel[];
}): Promise<Notification[]> => {
  const channels = input.channels ?? ["in-app"];
  return channels.map((channel) =>
    makeFixtureNotification({
      userId: input.userId,
      category: input.category,
      payload: input.payload,
      channel,
    }),
  );
};

export const markAsRead = async (input: {
  userId: string;
  notificationId: string;
}): Promise<{ ok: true }> => ({ ok: true });

export type NotificationPreferences = {
  userId: string;
  channels: Record<NotificationChannel, boolean>;
  categories: Record<NotificationCategory, boolean>;
};

export const getPreferences = async (
  userId: string,
): Promise<NotificationPreferences> => ({
  userId,
  channels: { "in-app": true, email: true, digest: false },
  categories: {
    message: true,
    "price-change": true,
    "dealer-response": true,
    payment: true,
    "deal-status": true,
    system: true,
  },
});

export const updatePreferences = async (
  prefs: NotificationPreferences,
): Promise<NotificationPreferences> => prefs;
