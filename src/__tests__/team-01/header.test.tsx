// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Header } from "@/components/shell/header";
import type { User } from "@/contracts";

const user: User = {
  id: "u-1",
  role: "buyer",
  phone: "+15555550100",
  zip: "43210",
  displayName: "Jane",
  preferences: { bestFit: "lowestTotal", notifChannels: ["in-app"] },
  createdAt: "2026-04-21T00:00:00.000Z",
};

describe("Header", () => {
  test("anonymous shows login + signup links", () => {
    render(<Header user={null} bellSlot={null} inboxSlot={null} />);
    expect(screen.getByText("Log in")).toBeTruthy();
    expect(screen.getByText("Sign up")).toBeTruthy();
  });

  test("authenticated renders the bell and inbox slots and the profile link", () => {
    render(
      <Header
        user={user}
        bellSlot={<span data-testid="bell-marker">b</span>}
        inboxSlot={<span data-testid="inbox-marker">i</span>}
      />,
    );
    expect(screen.getByTestId("bell-marker")).toBeTruthy();
    expect(screen.getByTestId("inbox-marker")).toBeTruthy();
    expect(screen.getByText("Jane")).toBeTruthy();
    expect(screen.queryByText("Sign up")).toBeNull();
  });

  test("falls back to phone when displayName missing", () => {
    const u: User = { ...user, displayName: undefined };
    delete u.displayName;
    render(<Header user={u} bellSlot={null} inboxSlot={null} />);
    expect(screen.getByText("+15555550100")).toBeTruthy();
  });
});
