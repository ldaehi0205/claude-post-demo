'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ImageUpload } from '@/components/ui/ImageUpload';
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
  const [removeImage, setRemoveImage] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    if (removeImage) {
      formData.append('removeImage', 'true');
    }

    if (isEdit) {
      await updatePost(formData, post.id);
    } else if (user) {
      await createPost(formData, user.id);
    }
  };

  const handleRemoveImage = () => {
    setRemoveImage(true);
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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          이미지
        </label>
        <ImageUpload
          name="image"
          initialImageUrl={post?.imageUrl}
          onRemoveImage={handleRemoveImage}
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
