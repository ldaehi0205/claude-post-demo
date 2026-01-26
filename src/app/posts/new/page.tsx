'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { PostForm } from '@/components/posts/PostForm';

export default function NewPostPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">새 글 작성</h1>
      <PostForm />
    </div>
  );
}
