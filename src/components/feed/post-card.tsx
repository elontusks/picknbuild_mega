import Link from "next/link";
import { getListing } from "@/services/team-03-supply";
import {
  countLikes,
  hasLiked,
  listComments,
} from "@/services/team-16-feed";
import type { FeedPost } from "@/lib/feed/types";
import { FeedEngagementControls } from "./engagement-controls";
import { ProfileLinkFromFeedPost } from "./profile-link";
import { VehicleCardInFeed } from "./vehicle-card-in-feed";
import { PostKindChip, PostKindTemplate } from "./templates";

type FeedPostCardProps = {
  post: FeedPost;
  viewerId?: string;
  viewerZip?: string;
  showEngagement?: boolean;
};

// Feed Post Card — the generic frame. Dispatches to PostKindTemplate for
// kind-specific bits. Loads linked listing + like/comment counts on the
// server so the card is useful even before the client-only engagement
// controls hydrate.
export async function FeedPostCard({
  post,
  viewerId,
  viewerZip,
  showEngagement = true,
}: FeedPostCardProps) {
  const [listing, likeCount, liked, comments] = await Promise.all([
    post.listingId ? getListing(post.listingId) : Promise.resolve(null),
    countLikes(post.id),
    viewerId
      ? hasLiked({ postId: post.id, userId: viewerId })
      : Promise.resolve(false),
    listComments(post.id),
  ]);

  const createdAt = new Date(post.createdAt);

  return (
    <article
      data-testid="feed-post-card"
      data-post-id={post.id}
      data-kind={post.kind}
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ProfileLinkFromFeedPost userId={post.authorId} />
          <PostKindChip kind={post.kind} />
        </div>
        <Link
          href={`/feed/${post.id}`}
          className="text-xs text-zinc-500 hover:underline dark:text-zinc-400"
          data-testid="feed-post-permalink"
        >
          {createdAt.toLocaleString()}
        </Link>
      </header>

      <p className="whitespace-pre-wrap text-sm text-zinc-900 dark:text-zinc-100">
        {post.body}
      </p>

      <PostKindTemplate post={post} />

      {post.mediaRefs && post.mediaRefs.length > 0 ? (
        <div
          className="grid gap-2"
          data-testid="post-media"
          style={{
            gridTemplateColumns: `repeat(${Math.min(post.mediaRefs.length, 3)}, minmax(0, 1fr))`,
          }}
        >
          {post.mediaRefs.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt={`Media ${i + 1}`}
              className="aspect-square w-full rounded-md object-cover"
            />
          ))}
        </div>
      ) : null}

      {listing ? (
        <VehicleCardInFeed
          listing={listing}
          {...(viewerZip ? { userZip: viewerZip } : {})}
        />
      ) : null}

      {showEngagement ? (
        <FeedEngagementControls
          postId={post.id}
          initialLiked={liked}
          initialLikeCount={likeCount}
          initialCommentCount={comments.length}
          canInteract={Boolean(viewerId)}
          permalinkPath={`/feed/${post.id}`}
        />
      ) : null}

      {comments.length > 0 ? (
        <ul
          data-testid="post-comments"
          className="flex flex-col gap-1 border-t border-zinc-100 pt-2 dark:border-zinc-900"
        >
          {comments.slice(-3).map((c) => (
            <li key={c.id} className="text-xs text-zinc-700 dark:text-zinc-300">
              <ProfileLinkFromFeedPost userId={c.userId} /> {c.body}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
