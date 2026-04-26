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
      className="mx-auto flex max-w-2xl flex-col gap-6 p-4 sm:p-6"
    >
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Community Feed</h1>
          <p className="text-sm text-muted-foreground mt-1">Share insights and connect with buyers</p>
        </div>
        {viewer ? (
          <Link
            href="/feed/upload"
            data-testid="feed-upload-link"
            className="rounded-lg bg-accent text-accent-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition inline-flex items-center gap-2 w-fit"
          >
            <span>+</span> Post a Vehicle
          </Link>
        ) : null}
      </header>

      {viewer ? (
        <PostComposer />
      ) : (
        <section
          data-testid="feed-signin-prompt"
          className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 text-center"
        >
          <p className="text-sm text-muted-foreground mb-3">
            👤 Browsing as a guest
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 font-semibold text-accent hover:text-accent/80 transition"
          >
            Sign in to post, like, or comment
            <span>→</span>
          </Link>
        </section>
      )}

      {posts.length === 0 ? (
        <div
          data-testid="feed-empty"
          className="rounded-lg border-2 border-dashed border-border p-12 text-center"
        >
          <div className="text-4xl mb-3">📭</div>
          <p className="text-sm font-semibold text-foreground mb-2">No posts yet</p>
          <p className="text-sm text-muted-foreground">
            Be the first to share your insights with the community!
          </p>
        </div>
      ) : (
        <ol
          data-testid="feed-list"
          className="flex list-none flex-col gap-4"
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
