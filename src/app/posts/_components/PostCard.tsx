'use client';

import Link from 'next/link';
import { Post } from '@/types/post';
import { LikeBadge } from './LikeBadge';

interface PostCardProps {
  post: Post;
  ids: number[];
  selectPost: (id: number) => void;
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

export function PostCard({ post, ids, selectPost }: PostCardProps) {
  const isSelected = ids.includes(post.id);

  return (
    <tr
      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-blue-50' : ''
      }`}
    >
      <td className="py-3 px-2 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => selectPost(post.id)}
          className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer"
        />
      </td>
      <td className="py-3 px-2 text-center text-sm text-gray-400">
        {post.id}
      </td>
      <td className="py-3 px-4">
        <Link
          href={`/posts/${post.id}`}
          className="text-gray-900 font-medium hover:text-blue-600 transition-colors truncate block"
        >
          {post.title}
        </Link>
        {post.postTags && post.postTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {post.postTags.map(({ tag }) => (
              <span
                key={tag.id}
                className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}
        {post.summary && (
          <p className="text-xs text-gray-400 mt-1 truncate">{post.summary}</p>
        )}
      </td>
      <td className="py-3 px-4 text-center text-sm text-gray-500 whitespace-nowrap">
        {post.author.name}
      </td>
      <td className="py-3 px-4 text-center text-sm text-gray-400 whitespace-nowrap">
        {formatDate(post.createdAt)}
      </td>
      <td className="py-3 px-2 text-center text-sm text-gray-400 whitespace-nowrap">
        {post.viewCount}
      </td>
      <td className="py-3 px-2 text-center text-sm text-gray-400 whitespace-nowrap">
        {post._count?.comments ?? 0}
      </td>
      <td className="py-3 px-2 text-center text-sm whitespace-nowrap">
        <LikeBadge likeCount={post._count?.likes ?? 0} />
      </td>
    </tr>
  );
}
