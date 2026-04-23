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
            className="rounded-md border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
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
          className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
        >
          Browsing as a guest.{" "}
          <Link
            href="/login"
            className="font-medium text-zinc-900 underline dark:text-zinc-100"
          >
            Sign in
          </Link>{" "}
          to post, like, or comment.
        </section>
      )}

      {posts.length === 0 ? (
        <p
          data-testid="feed-empty"
          className="rounded-xl border border-zinc-200 p-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
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
