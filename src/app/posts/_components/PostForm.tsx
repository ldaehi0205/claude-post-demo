'use client';

import { useState, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
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

  const initialTags = post?.postTags?.map(({ tag }) => tag.name) ?? [];
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState('');

  const addTag = (value: string) => {
    const tag = value.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const handleSubmit = async (formData: FormData) => {
    formData.set('tags', JSON.stringify(tags));
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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          태그
        </label>
        <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-300 rounded-md bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 min-h-[42px]">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded"
            >
              #{tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-blue-400 hover:text-blue-600"
              >
                &times;
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
            placeholder={tags.length === 0 ? '태그를 입력하고 Enter' : ''}
            className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
          />
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Enter 또는 쉼표(,)로 태그를 추가합니다.
        </p>
      </div>
      <SubmitButtons isEdit={isEdit} onCancel={() => router.back()} />
    </form>
  );
}

function SubmitButtons({ isEdit, onCancel }: { isEdit: boolean; onCancel: () => void }) {
  const { pending } = useFormStatus();

  return (
    <div className="flex gap-2">
      <Button type="submit" disabled={pending}>
        {pending ? '처리 중...' : isEdit ? '수정' : '작성'}
      </Button>
      <Button type="button" variant="secondary" onClick={onCancel} disabled={pending}>
        취소
      </Button>
    </div>
  );
}
