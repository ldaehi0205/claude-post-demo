'use client';

import { useComments } from '@/hooks/useComments';
import { useAuth } from '@/hooks/useAuth';
import { CommentList } from './CommentList';
import { CommentForm } from './CommentForm';

interface CommentSectionProps {
  postId: number;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { data: comments, isLoading } = useComments(postId);
  const { isAuthenticated } = useAuth();

  return (
    <div className="mt-8 border-t pt-8">
      <h2 className="text-lg font-bold mb-4">
        댓글 {comments?.length ?? 0}개
      </h2>

      {isAuthenticated && <CommentForm postId={postId} />}

      {isLoading ? (
        <div className="text-center py-4 text-gray-500">댓글 로딩 중...</div>
      ) : (
        <CommentList postId={postId} comments={comments ?? []} />
      )}
    </div>
  );
}
