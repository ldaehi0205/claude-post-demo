'use client';

import { prisma } from '@/data/prisma';
import { PostCard } from './PostCard';
import { postsApi } from '@/apis/posts';
import DeleteButton from './DeleteButton';
import { useState } from 'react';

export function PostList({ posts }: any) {
  const [ids, setIds] = useState<number[]>([]);

  const selectPost = (id: number) => {
    setIds(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id],
    );
  };

  const clearSelectPost = () => setIds([]);

  return (
    <div className="flex flex-col gap-4">
      <div className="self-end">
        <DeleteButton ids={ids} clearSelectPost={clearSelectPost} />
      </div>
      {posts.map((post: any) => (
        <PostCard key={post.id} post={post} ids={ids} selectPost={selectPost} />
      ))}
    </div>
  );
}
