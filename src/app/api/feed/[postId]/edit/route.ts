import { requireUser } from '@/services/team-01-auth';
import { getFeedPost, updateFeedPost } from '@/services/team-16-feed';
import { revalidatePath } from 'next/cache';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const user = await requireUser();
    const { postId } = await params;

    const post = await getFeedPost(postId);
    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.authorId !== user.id) {
      return Response.json(
        { error: 'Unauthorized: only the author can edit this post' },
        { status: 403 }
      );
    }

    const { body, extras } = await request.json();

    const result = await updateFeedPost(postId, { body, extras });
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    revalidatePath('/feed');
    revalidatePath(`/feed/${postId}`);

    return Response.json({ success: true, post: result.post });
  } catch (error) {
    console.error('Error updating post:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to update post' },
      { status: 500 }
    );
  }
}
