'use client';

import { Comment } from '@/types/comment';
import { CommentItem } from './CommentItem';

interface CommentListProps {
  postId: number;
  comments: Comment[];
}

export function CommentList({ postId, comments }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        첫 댓글을 작성해보세요!
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {comments.map((comment) => (
        <CommentItem key={comment.id} postId={postId} comment={comment} />
      ))}
    </ul>
  );
}
