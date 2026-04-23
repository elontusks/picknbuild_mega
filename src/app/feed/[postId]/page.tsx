import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/services/team-01-auth";
import { getFeedPost } from "@/services/team-16-feed";
import { FeedPostCard } from "@/components/feed/post-card";

export const dynamic = "force-dynamic";

type Params = { postId: string };

export default async function FeedPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { postId } = await params;
  const [viewer, post] = await Promise.all([
    getCurrentUser(),
    getFeedPost(postId),
  ]);
  if (!post) notFound();

  return (
    <main
      data-testid="feed-post-page"
      className="mx-auto flex max-w-2xl flex-col gap-4 p-4"
    >
      <Link
        href="/feed"
        className="text-xs text-zinc-500 hover:underline dark:text-zinc-400"
      >
        ← Back to feed
      </Link>
      <FeedPostCard
        post={post}
        {...(viewer?.id ? { viewerId: viewer.id } : {})}
        {...(viewer?.zip ? { viewerZip: viewer.zip } : {})}
      />
    </main>
  );
}
