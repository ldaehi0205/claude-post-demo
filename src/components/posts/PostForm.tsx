'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/hooks/useAuth';
import { createPost, updatePost } from '@/app/actions/posts';
import { Post } from '@/types/post';

interface PostFormProps {
  post?: Post;
}

export function PostForm({ post }: PostFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isEdit = !!post;

  /** 게시글 작성/수정 서버 액션 핸들러 */
  const handleSubmit = async (formData: FormData) => {
    if (isEdit) {
      await updatePost(formData, post.id);
    } else if (user) {
      await createPost(formData, user.id);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <Input
        name="title"
        label="제목"
        defaultValue={post?.title ?? ''}
        required
      />
      <Textarea
        name="content"
        label="내용"
        defaultValue={post?.content ?? ''}
        rows={10}
        required
      />
      <div className="flex gap-2">
        <Button type="submit">{isEdit ? '수정' : '작성'}</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          취소
        </Button>
      </div>
    </form>
  );
}
