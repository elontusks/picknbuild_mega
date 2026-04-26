import { requireUser } from '@/services/team-01-auth';
import { deleteComment, listComments } from '@/services/team-16-feed';
import { revalidatePath } from 'next/cache';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ postId: string; commentId: string }> }
) {
  try {
    const user = await requireUser();
    const { postId, commentId } = await params;

    // Get the comment to verify ownership
    const comments = await listComments(postId);
    const comment = comments.find((c) => c.id === commentId);

    if (!comment) {
      return Response.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (comment.userId !== user.id) {
      return Response.json(
        { error: 'Unauthorized: only the comment author can delete this comment' },
        { status: 403 }
      );
    }

    const deleted = await deleteComment(commentId);
    if (!deleted) {
      return Response.json({ error: 'Failed to delete comment' }, { status: 400 });
    }

    revalidatePath('/feed');
    revalidatePath(`/feed/${postId}`);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
