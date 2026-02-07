'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MarkdownEditor } from '@/components/ui/MarkdownEditor';
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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          내용
        </label>
        <MarkdownEditor
          name="content"
          defaultValue={post?.content ?? ''}
          placeholder="마크다운으로 작성하세요. 이미지는 드래그앤드롭, 붙여넣기, 또는 툴바 버튼으로 업로드할 수 있습니다."
          required
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit">{isEdit ? '수정' : '작성'}</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          취소
        </Button>
      </div>
    </form>
  );
}
