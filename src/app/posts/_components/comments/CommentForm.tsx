'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { useCreateComment } from '@/hooks/useComments';

interface CommentFormProps {
  postId: number;
}

export function CommentForm({ postId }: CommentFormProps) {
  const [content, setContent] = useState('');
  const createComment = useCreateComment(postId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    await createComment.mutateAsync({ content: content.trim() });
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="댓글을 작성하세요"
        rows={3}
      />
      <div className="mt-2 flex justify-end">
        <Button
          type="submit"
          disabled={createComment.isPending || !content.trim()}
        >
          {createComment.isPending ? '등록 중...' : '댓글 등록'}
        </Button>
      </div>
    </form>
  );
}
