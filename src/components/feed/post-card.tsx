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
      className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 shadow-md transition-all duration-200 hover:shadow-lg hover:border-accent/50"
    >
      <header className="flex items-start justify-between gap-3 pb-3 border-b border-border/50">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center">
              <span className="text-xs font-bold text-accent-foreground">
                {(post.authorId || "?").substring(0, 1).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <ProfileLinkFromFeedPost userId={post.authorId} />
            <PostKindChip kind={post.kind} />
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Link
            href={`/feed/${post.id}`}
            className="text-xs text-muted-foreground hover:text-accent transition-colors whitespace-nowrap"
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
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground font-medium">
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
        />
      ) : null}

      {comments.length > 0 ? (
        <div
          data-testid="post-comments"
          className="flex flex-col gap-3 border-t border-border/50 pt-4"
        >
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Comments ({comments.length})
          </div>
          <ul className="flex flex-col gap-3">
            {comments.slice(-3).map((c) => (
              <li
                key={c.id}
                className="flex items-start justify-between gap-2 p-3 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <ProfileLinkFromFeedPost userId={c.userId} />
                  <p className="text-sm text-foreground break-words leading-relaxed">
                    {c.body}
                  </p>
                </div>
                {viewerId === c.userId && (
                  <CommentActionButton commentId={c.id} postId={post.id} />
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
