'use client';

import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/Button';
import { usePost, usePostSummary, useDeletePost } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import { CommentSection } from './comments/CommentSection';
import { LikeButton } from './LikeButton';

const MarkdownPreview = dynamic(() => import('@/components/ui/MarkdownPreview'), {
  ssr: false,
  loading: () => <p className="text-gray-400">로딩 중...</p>,
});

interface PostDetailProps {
  id: number;
}

export function PostDetail({ id }: PostDetailProps) {
  const router = useRouter();
  const { data: post, isLoading, error } = usePost(id);
  const { data: summaryData } = usePostSummary(id);
  const deletePost = useDeletePost();
  const { user } = useAuth();

  const summary = summaryData?.summary ?? post?.summary ?? null;

  const isAuthor = user && post && user.id === post.authorId;

  if (isLoading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  if (error || !post) {
    return (
      <div className="text-center py-8 text-red-500">
        게시글을 찾을 수 없습니다.
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirm('정말 삭제하시겠습니까?')) {
      await deletePost.mutateAsync([id]);
      router.refresh();
      router.push('/posts');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
      <div className="flex gap-2 text-sm text-gray-500 mb-6">
        <span>{post.author?.name}</span>
        <span>·</span>
        <span>{new Date(post.createdAt).toLocaleString()}</span>
        <span>·</span>
        <span>조회 {post.viewCount}</span>
      </div>
      {summary ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <span className="text-sm font-medium text-blue-700 block mb-1">AI 요약</span>
          <p className="text-sm text-blue-900 leading-relaxed">{summary}</p>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500">AI 요약을 생성 중입니다...</span>
          </div>
        </div>
      )}
      <MarkdownPreview content={post.content} className="prose prose-lg max-w-none mb-8" />
      <div className="flex gap-2">
        {isAuthor && (
          <>
            <Button onClick={() => router.push(`/posts/${id}/edit`)}>
              수정
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              삭제
            </Button>
          </>
        )}
        <Button variant="secondary" onClick={() => router.push('/posts')}>
          목록
        </Button>
      </div>

      <CommentSection postId={id} />
    </div>
  );
}
