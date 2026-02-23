'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTags } from '@/hooks/useTags';

export function TagSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTag = searchParams.get('tag');

  const { data: tags, isLoading, error } = useTags();

  const handleTagClick = (tagName: string) => {
    if (selectedTag === tagName) {
      router.push('/posts');
    } else {
      router.push(`/posts?tag=${encodeURIComponent(tagName)}`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-bold mb-4 text-gray-800">태그</h2>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-8 bg-gray-100 rounded animate-pulse"
            />
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500">태그를 불러올 수 없습니다.</p>
      )}

      {!isLoading && !error && (!tags || tags.length === 0) && (
        <p className="text-sm text-gray-400">태그가 없습니다.</p>
      )}

      {tags && tags.length > 0 && (
        <ul className="space-y-1">
          {tags.map((tag) => (
            <li key={tag.name}>
              <button
                onClick={() => handleTagClick(tag.name)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  selectedTag === tag.name
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <span>#{tag.name}</span>
                <span className="ml-1 text-gray-400">({tag.postCount})</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
