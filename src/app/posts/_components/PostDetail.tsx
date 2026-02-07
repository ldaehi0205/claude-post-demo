'use client';

import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/Button';
import { usePost, useDeletePost } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import { CommentSection } from './comments/CommentSection';

const MarkdownPreview = dynamic(
  () => import('@/components/ui/MarkdownPreview').then((mod) => mod.MarkdownPreview),
  { ssr: false, loading: () => <p className="text-gray-400">로딩 중...</p> }
);

interface PostDetailProps {
  id: number;
}

export function PostDetail({ id }: PostDetailProps) {
  const router = useRouter();
  const { data: post, isLoading, error } = usePost(id);
  const deletePost = useDeletePost();
  const { user } = useAuth();

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
      </div>
      <div className="prose prose-lg max-w-none mb-8">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            img: ({ src, alt }) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={alt || ''}
                className="max-w-full h-auto rounded-lg"
                loading="lazy"
              />
            ),
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>
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
