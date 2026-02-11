'use client';

import { useState } from 'react';
import { Post } from '@/types/post';
import { PostCard } from './PostCard';
import DeleteButton from './DeleteButton';

interface PostListProps {
  posts: Post[];
}

export function PostList({ posts }: PostListProps) {
  const [ids, setIds] = useState<number[]>([]);

  const selectPost = (id: number) => {
    setIds(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    setIds(prev =>
      prev.length === posts.length ? [] : posts.map(p => p.id),
    );
  };

  const clearSelectPost = () => setIds([]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <DeleteButton ids={ids} clearSelectPost={clearSelectPost} />
      </div>
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-200 text-sm text-gray-500 whitespace-nowrap">
            <th className="py-3 px-2 w-10 text-center">
              <input
                type="checkbox"
                checked={posts.length > 0 && ids.length === posts.length}
                onChange={toggleAll}
                className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer"
              />
            </th>
            <th className="py-3 px-2 w-16 text-center">번호</th>
            <th className="py-3 px-4 text-left">제목</th>
            <th className="py-3 px-4 w-28 text-center">작성자</th>
            <th className="py-3 px-4 w-32 text-center">작성일</th>
            <th className="py-3 px-2 w-16 text-center">조회</th>
            <th className="py-3 px-2 w-16 text-center">댓글</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} ids={ids} selectPost={selectPost} />
          ))}
        </tbody>
      </table>
      {posts.length === 0 && (
        <p className="text-center text-gray-400 py-10">게시글이 없습니다.</p>
      )}
    </div>
  );
}
