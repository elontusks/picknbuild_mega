// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

const listNotifications = vi.fn();
const listThreads = vi.fn();

vi.mock("@/services", () => ({
  Notifications: { listNotifications: (...args: unknown[]) => listNotifications(...args) },
  Messaging: { listThreads: (...args: unknown[]) => listThreads(...args) },
}));

import { NotificationBell } from "@/components/shell/notification-bell";
import { InboxEntry } from "@/components/shell/inbox-entry";

describe("NotificationBell (Team 13 mount point)", () => {
  test("counts unread notifications from the fixture service", async () => {
    listNotifications.mockResolvedValueOnce([
      { id: "n1", userId: "u-1", category: "system", payload: {}, channel: "in-app", createdAt: "" },
      { id: "n2", userId: "u-1", category: "message", payload: {}, channel: "in-app", createdAt: "", readAt: "2026-04-21T00:00:00Z" },
      { id: "n3", userId: "u-1", category: "payment", payload: {}, channel: "in-app", createdAt: "" },
    ]);
    const ui = await NotificationBell({ userId: "u-1" });
    render(ui);
    expect(listNotifications).toHaveBeenCalledWith("u-1");
    expect(screen.getByTestId("bell-unread").textContent).toBe("2");
  });

  test("hides the badge when nothing is unread", async () => {
    listNotifications.mockResolvedValueOnce([
      { id: "n1", userId: "u-1", category: "system", payload: {}, channel: "in-app", createdAt: "", readAt: "x" },
    ]);
    const ui = await NotificationBell({ userId: "u-1" });
    render(ui);
    expect(screen.queryByTestId("bell-unread")).toBeNull();
  });
});

describe("InboxEntry (Team 13 mount point)", () => {
  test("shows the thread count returned by the messaging fixture", async () => {
    listThreads.mockResolvedValueOnce([
      { id: "t1", participants: [], kind: "buyer-dealer", lastMessageAt: "" },
      { id: "t2", participants: [], kind: "buyer-seller", lastMessageAt: "" },
    ]);
    const ui = await InboxEntry({ userId: "u-1" });
    render(ui);
    expect(listThreads).toHaveBeenCalledWith("u-1");
    expect(screen.getByTestId("inbox-count").textContent).toBe("2");
  });
});
