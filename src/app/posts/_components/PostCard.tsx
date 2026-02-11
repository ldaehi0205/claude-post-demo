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
      </td>
      <td className="py-3 px-4 text-center text-sm text-gray-500">
        {post.author.name}
      </td>
      <td className="py-3 px-4 text-center text-sm text-gray-400">
        {new Date(post.createdAt).toLocaleDateString()}
      </td>
      <td className="py-3 px-2 text-center text-sm text-gray-400">
        {post._count?.comments ?? 0}
      </td>
    </tr>
  );
}
