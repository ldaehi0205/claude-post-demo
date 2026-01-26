'use client'

import { usePosts } from '@/hooks/usePosts'
import { PostCard } from './PostCard'

export function PostList() {
  const { data: posts, isLoading, error } = usePosts()

  if (isLoading) {
    return <div className="text-center py-8">로딩 중...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">에러가 발생했습니다.</div>
  }

  if (!posts || posts.length === 0) {
    return <div className="text-center py-8 text-gray-500">게시글이 없습니다.</div>
  }

  return (
    <div className="grid gap-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
