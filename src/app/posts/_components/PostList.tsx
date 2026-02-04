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

  const clearSelectPost = () => setIds([]);

  return (
    <div className="flex flex-col gap-4">
      <div className="self-end">
        <DeleteButton ids={ids} clearSelectPost={clearSelectPost} />
      </div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} ids={ids} selectPost={selectPost} />
      ))}
    </div>
  );
}
