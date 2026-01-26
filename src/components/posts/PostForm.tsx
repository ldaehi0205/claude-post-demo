'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useCreatePost, useUpdatePost } from '@/hooks/usePosts'
import { Post } from '@/types/post'

interface PostFormProps {
  post?: Post
}

export function PostForm({ post }: PostFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(post?.title ?? '')
  const [content, setContent] = useState(post?.content ?? '')

  const createPost = useCreatePost()
  const updatePost = useUpdatePost()

  const isEdit = !!post

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isEdit) {
      await updatePost.mutateAsync({ id: post.id, input: { title, content } })
    } else {
      await createPost.mutateAsync({ title, content })
    }

    router.push('/posts')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <Textarea
        label="내용"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={10}
        required
      />
      <div className="flex gap-2">
        <Button type="submit">
          {isEdit ? '수정' : '작성'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          취소
        </Button>
      </div>
    </form>
  )
}
