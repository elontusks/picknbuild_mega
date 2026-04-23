// @vitest-environment jsdom
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "@testing-library/react";
import { makeFixtureListingObject, makeFixtureUser } from "@/contracts";

// Bucket-backed storage so FeedPostCard's internal reads (countLikes,
// listComments, hasLiked) still work against our fixtures.
type Bucket = Map<string, unknown>;
const buckets = new Map<string, Bucket>();
const getBucket = (name: string): Bucket => {
  if (!buckets.has(name)) buckets.set(name, new Map());
  return buckets.get(name)!;
};

const hoisted = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getListing: vi.fn(),
}));

vi.mock("@/services/team-01-auth", () => ({
  getCurrentUser: (...a: unknown[]) => hoisted.getCurrentUser(...a),
  requireUser: vi.fn(() => {
    throw new Error("requireUser should not be called from public feed render");
  }),
}));

vi.mock("@/services/team-03-supply", () => ({
  getListing: (...a: unknown[]) => hoisted.getListing(...a),
}));

vi.mock("@/services/team-15-storage", () => ({
  putRecord: vi.fn(async (bucket: string, id: string, value: unknown) => {
    getBucket(bucket).set(id, value);
  }),
  getRecord: vi.fn(async (bucket: string, id: string) =>
    getBucket(bucket).get(id) ?? null,
  ),
  listRecords: vi.fn(async (bucket: string) =>
    Array.from(getBucket(bucket).values()),
  ),
  removeRecord: vi.fn(async (bucket: string, id: string) => {
    getBucket(bucket).delete(id);
  }),
  appendToList: vi.fn(async (bucket: string, id: string, value: unknown) => {
    const b = getBucket(bucket);
    const existing = (b.get(id) as unknown[] | undefined) ?? [];
    b.set(id, [...existing, value]);
  }),
}));

vi.mock("@/services/team-13-notifications", () => ({
  emitNotification: vi.fn(async () => []),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("__redirect__");
  }),
  notFound: vi.fn(() => {
    throw new Error("__notfound__");
  }),
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

// Stub FeedPostCard — it's an async Server Component that RTL can't render
// directly. We're testing the shell (header, composer gating, empty state,
// list presence), not the card internals.
vi.mock("@/components/feed/post-card", () => ({
  FeedPostCard: ({ post }: { post: { id: string } }) => (
    <div data-testid={`stub-card-${post.id}`} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { createFeedPost } from "@/services/team-16-feed";
import FeedPage from "@/app/feed/page";
import { VehicleCardInFeed } from "@/components/feed/vehicle-card-in-feed";

const resetAll = () => {
  for (const b of buckets.values()) b.clear();
  hoisted.getCurrentUser.mockReset();
  hoisted.getListing.mockReset();
  hoisted.getListing.mockResolvedValue(null);
};

beforeEach(() => {
  resetAll();
});

describe("/feed page", () => {
  test("renders without calling requireUser when the viewer is anonymous", async () => {
    hoisted.getCurrentUser.mockResolvedValue(null);
    await createFeedPost({
      authorId: "u_1",
      kind: "question",
      body: "Hello community",
    });

    // Next's dynamic server components are async. Await the element tree
    // before rendering so React can walk its children synchronously.
    const ui = await FeedPage();
    const { getByTestId, queryByTestId } = render(ui);
    expect(getByTestId("feed-page")).toBeTruthy();
    expect(getByTestId("feed-list")).toBeTruthy();
    // Anonymous viewers see the sign-in prompt, not the composer.
    expect(queryByTestId("post-composer")).toBeNull();
    expect(getByTestId("feed-signin-prompt")).toBeTruthy();
    expect(hoisted.getCurrentUser).toHaveBeenCalledTimes(1);
  });

  test("shows composer for authenticated viewers", async () => {
    hoisted.getCurrentUser.mockResolvedValue(makeFixtureUser({ id: "u_1" }));
    const ui = await FeedPage();
    const { getByTestId } = render(ui);
    expect(getByTestId("post-composer")).toBeTruthy();
    expect(getByTestId("feed-upload-link")).toBeTruthy();
  });

  test("shows the empty state when the feed is empty", async () => {
    hoisted.getCurrentUser.mockResolvedValue(null);
    const ui = await FeedPage();
    const { getByTestId } = render(ui);
    expect(getByTestId("feed-empty")).toBeTruthy();
  });
});

describe("VehicleCardInFeed", () => {
  test("renders a ListingObject via the Team 7 VehicleCard with variant=\"feed\"", () => {
    const listing = makeFixtureListingObject({ id: "listing_1" });
    const { getByTestId } = render(<VehicleCardInFeed listing={listing} />);
    const card = getByTestId("vehicle-card");
    // Team 7's VehicleCard tags the variant on a data attribute.
    expect(card.getAttribute("data-variant")).toBe("feed");
  });
});
