import Link from "next/link";
import { getCurrentUser } from "@/services/team-01-auth";
import { listFeedPosts } from "@/services/team-16-feed";
import { FeedPostCard } from "@/components/feed/post-card";
import { PostComposer } from "@/components/feed/post-composer";

// ARCHITECTURE §2 live-update: feed should pick up new posts without a
// manual reload after revalidatePath("/feed").
export const dynamic = "force-dynamic";

export default async function FeedPage() {
  // Read-anonymous: the feed itself is public. Only mutations gate on
  // requireUser — so we peek at the session without forcing a redirect.
  const viewer = await getCurrentUser();
  const posts = await listFeedPosts();

  return (
    <main
      data-testid="feed-page"
      className="mx-auto flex max-w-2xl flex-col gap-4 p-4"
    >
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Community feed</h1>
        {viewer ? (
          <Link
            href="/feed/upload"
            data-testid="feed-upload-link"
            className="rounded-md border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-background-800 dark:hover:bg-muted"
          >
            Post a vehicle
          </Link>
        ) : null}
      </header>

      {viewer ? (
        <PostComposer />
      ) : (
        <section
          data-testid="feed-signin-prompt"
          className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground-700"
        >
          Browsing as a guest.{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline"
          >
            Sign in
          </Link>{" "}
          to post, like, or comment.
        </section>
      )}

      {posts.length === 0 ? (
        <p
          data-testid="feed-empty"
          className="rounded-xl border border-border p-6 text-center text-sm text-muted-foreground-800"
        >
          No posts yet — be the first to share.
        </p>
      ) : (
        <ol
          data-testid="feed-list"
          className="flex list-none flex-col gap-3"
        >
          {posts.map((p) => (
            <li key={p.id}>
              <FeedPostCard
                post={p}
                {...(viewer?.id ? { viewerId: viewer.id } : {})}
                {...(viewer?.zip ? { viewerZip: viewer.zip } : {})}
              />
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
