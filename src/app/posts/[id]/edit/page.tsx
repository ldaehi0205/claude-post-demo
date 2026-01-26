'use client'

import { usePost } from '@/hooks/usePosts'
import { PostForm } from '@/components/posts/PostForm'

interface Props {
  params: { id: string }
}

export default function EditPostPage({ params }: Props) {
  const { data: post, isLoading } = usePost(Number(params.id))

  if (isLoading) {
    return <div className="text-center py-8">로딩 중...</div>
  }

  if (!post) {
    return <div className="text-center py-8 text-red-500">게시글을 찾을 수 없습니다.</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">글 수정</h1>
      <PostForm post={post} />
    </div>
  )
}
