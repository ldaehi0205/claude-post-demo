'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePost } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import { PostForm } from '@/components/posts/PostForm';

interface Props {
  params: { id: string };
}

export default function EditPostPage({ params }: Props) {
  const router = useRouter();
  const { data: post, isLoading: postLoading } = usePost(Number(params.id));
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const isLoading = postLoading || authLoading;
  const isAuthor = user && post && user.id === post.authorId;

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (post && !isAuthor) {
        router.push(`/posts/${params.id}`);
      }
    }
  }, [isLoading, isAuthenticated, isAuthor, post, router, params.id]);

  if (isLoading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  if (!post) {
    return <div className="text-center py-8 text-red-500">게시글을 찾을 수 없습니다.</div>;
  }

  if (!isAuthor) {
    return null;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">글 수정</h1>
      <PostForm post={post} />
    </div>
  );
}
