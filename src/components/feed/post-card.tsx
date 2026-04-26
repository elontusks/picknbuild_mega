import Link from "next/link";
import { getListing } from "@/services/team-03-supply";
import {
  countLikes,
  getPostMedia,
  hasLiked,
  listComments,
  type FeedPostListItem,
} from "@/services/team-16-feed";
import type { FeedPost } from "@/lib/feed/types";
import { FeedEngagementControls } from "./engagement-controls";
import { ProfileLinkFromFeedPost } from "./profile-link";
import { VehicleCardInFeed } from "./vehicle-card-in-feed";
import { PostKindChip, PostKindTemplate } from "./templates";
import { PostActionMenu } from "./post-action-menu";
import { CommentActionButton } from "./comment-action-button";

// Accepts either shape:
//   - FeedPost: full row from getFeedPost() (has mediaRefs inline)
//   - FeedPostListItem: stripped row from listFeedPosts() (mediaCount only)
// Media is fetched on-demand via getPostMedia() when mediaCount > 0.
type FeedPostCardProps = {
  post: FeedPost | FeedPostListItem;
  viewerId?: string;
  viewerZip?: string;
  showEngagement?: boolean;
};

const resolveMedia = async (
  post: FeedPost | FeedPostListItem,
): Promise<string[]> => {
  // FeedPostListItem has mediaCount; FeedPost does not. Use that as the
  // discriminator since mediaRefs is optional on FeedPost.
  if ("mediaCount" in post) {
    if (post.mediaCount === 0) return [];
    return getPostMedia(post.id);
  }
  return post.mediaRefs ?? [];
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
  const [listing, likeCount, liked, comments, mediaRefs] = await Promise.all([
    post.listingId ? getListing(post.listingId) : Promise.resolve(null),
    countLikes(post.id),
    viewerId
      ? hasLiked({ postId: post.id, userId: viewerId })
      : Promise.resolve(false),
    listComments(post.id),
    resolveMedia(post),
  ]);

  const createdAt = new Date(post.createdAt);

  return (
    <article
      data-testid="feed-post-card"
      data-post-id={post.id}
      data-kind={post.kind}
      className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <ProfileLinkFromFeedPost userId={post.authorId} />
          <PostKindChip kind={post.kind} />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href={`/feed/${post.id}`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            data-testid="feed-post-permalink"
            title={createdAt.toLocaleString()}
          >
            {createdAt.toLocaleDateString()}
          </Link>
          {viewerId === post.authorId && (
            <PostActionMenu postId={post.id} postBody={post.body} extras={post.extras} />
          )}
        </div>
      </header>

      <div className="space-y-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {post.body}
        </p>

        <PostKindTemplate post={post} />

        {mediaRefs.length > 0 ? (
          <div
            className="grid gap-3 mt-3"
            data-testid="post-media"
            style={{
              gridTemplateColumns: `repeat(${Math.min(mediaRefs.length, 3)}, minmax(0, 1fr))`,
            }}
          >
            {mediaRefs.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt={`Media ${i + 1}`}
                className="aspect-square w-full rounded-lg object-cover border border-border"
              />
            ))}
          </div>
        ) : null}
      </div>

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
          className="flex flex-col gap-3 border-t border-border pt-3"
        >
          {comments.slice(-3).map((c) => (
            <li
              key={c.id}
              className="flex items-start justify-between gap-2 text-xs text-muted-foreground"
            >
              <div className="flex flex-col gap-1 flex-1">
                <ProfileLinkFromFeedPost userId={c.userId} />
                <p className="text-sm text-foreground break-words">{c.body}</p>
              </div>
              {viewerId === c.userId && (
                <CommentActionButton commentId={c.id} postId={post.id} />
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
