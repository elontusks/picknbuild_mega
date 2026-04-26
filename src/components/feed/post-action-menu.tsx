'use client';

import { useState } from 'react';
import { MoreVertical, Edit2, Trash2 } from 'lucide-react';
import type { FeedPost } from '@/lib/feed/types';

type PostActionMenuProps = {
  postId: string;
  postBody: string;
  extras?: FeedPost['extras'];
};

export function PostActionMenu({ postId, postBody, extras }: PostActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBody, setEditedBody] = useState(postBody);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveEdit = async () => {
    if (!editedBody.trim()) return;

    try {
      setIsSaving(true);
      const response = await fetch(`/api/feed/${postId}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: editedBody.trim(),
          extras,
        }),
      });

      if (!response.ok) throw new Error('Failed to update post');

      setIsEditing(false);
      setIsOpen(false);
      window.location.reload();
    } catch (err) {
      console.error('Error updating post:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/feed/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete post');

      window.location.reload();
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
        title="Post options"
        disabled={isDeleting}
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && !isEditing && (
        <div className="absolute right-0 top-full mt-1 rounded-md bg-card border border-border shadow-lg z-10 min-w-40">
          <button
            onClick={() => setIsEditing(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors text-left border-b border-border"
          >
            <Edit2 size={14} />
            Edit post
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors text-left disabled:opacity-50"
          >
            <Trash2 size={14} />
            {isDeleting ? 'Deleting...' : 'Delete post'}
          </button>
        </div>
      )}

      {isEditing && (
        <div className="absolute right-0 top-full mt-2 rounded-lg bg-card border border-border shadow-xl z-20 p-3 min-w-80">
          <textarea
            value={editedBody}
            onChange={(e) => setEditedBody(e.target.value)}
            className="w-full p-2 border border-border rounded-md bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent"
            rows={4}
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSaveEdit}
              disabled={isSaving || !editedBody.trim()}
              className="flex-1 px-3 py-1.5 bg-accent text-accent-foreground rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditedBody(postBody);
              }}
              className="flex-1 px-3 py-1.5 bg-muted text-foreground rounded-md text-sm font-medium hover:bg-border transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
