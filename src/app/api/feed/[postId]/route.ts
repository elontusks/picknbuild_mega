import { requireUser } from '@/services/team-01-auth';
import { getFeedPost, deleteFeedPost } from '@/services/team-16-feed';
import { revalidatePath } from 'next/cache';

export async function DELETE(
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
        { error: 'Unauthorized: only the author can delete this post' },
        { status: 403 }
      );
    }

    const deleted = await deleteFeedPost(postId);
    if (!deleted) {
      return Response.json({ error: 'Failed to delete post' }, { status: 400 });
    }

    revalidatePath('/feed');

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to delete post' },
      { status: 500 }
    );
  }
}
