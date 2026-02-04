'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateComment, useDeleteComment } from '@/hooks/useComments';
import { Comment } from '@/types/comment';

interface CommentItemProps {
  postId: number;
  comment: Comment;
}

export function CommentItem({ postId, comment }: CommentItemProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const updateComment = useUpdateComment(postId);
  const deleteComment = useDeleteComment(postId);

  const isAuthor = user && user.id === comment.authorId;

  const handleUpdate = async () => {
    if (!editContent.trim()) return;
    await updateComment.mutateAsync({
      commentId: comment.id,
      input: { content: editContent.trim() },
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm('댓글을 삭제하시겠습니까?')) {
      await deleteComment.mutateAsync(comment.id);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  return (
    <li className="border-b pb-4">
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-2 text-sm text-gray-500">
          <span className="font-medium text-gray-700">{comment.author.name}</span>
          <span>·</span>
          <span>{new Date(comment.createdAt).toLocaleString()}</span>
        </div>
        {isAuthor && !isEditing && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              수정
            </button>
            <button
              onClick={handleDelete}
              className="text-sm text-red-500 hover:text-red-700"
              disabled={deleteComment.isPending}
            >
              삭제
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
          />
          <div className="mt-2 flex gap-2 justify-end">
            <Button variant="secondary" onClick={handleCancel}>
              취소
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateComment.isPending || !editContent.trim()}
            >
              {updateComment.isPending ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap">{comment.content}</p>
      )}
    </li>
  );
}
