'use client';

import Link from 'next/link';
import { Post } from '@/types/post';

interface PostCardProps {
  post: Post;
  ids: number[];
  selectPost: (id: number) => void;
}

export function PostCard({ post, ids, selectPost }: PostCardProps) {
  const isSelected = ids.includes(post.id);

  return (
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => selectPost(post.id)}
        className="mt-4 w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer"
      />
      <Link href={`/posts/${post.id}`} className="flex-1">
        <div
          className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
            isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}
        >
          <div className="flex justify-between items-start">
            <h2 className="text-lg font-semibold text-gray-900 flex-1">
              {post.title}
            </h2>
            {post._count && post._count.comments > 0 && (
              <span className="ml-2 text-sm text-gray-500 whitespace-nowrap">
                [{post._count.comments}]
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-2">
            {post.author.name} / {new Date(post.createdAt).toLocaleDateString()}
          </p>
        </div>
      </Link>
    </div>
  );
}
