'use client';

import { useEffect, useRef, useState } from 'react';
import { useInfinitePosts } from '@/hooks/usePosts';
import { Post } from '@/types/post';
import { PostCard } from './PostCard';
import DeleteButton from './DeleteButton';
import { PostSkeletonRows } from './PostSkeletonRows';

interface PostListProps {
  tag?: string;
}

export function PostList({ tag }: PostListProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfinitePosts(tag);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const posts: Post[] = data?.pages.flatMap((page) => page.items) ?? [];

  const selectPost = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    setSelectedIds((prev) =>
      prev.length === posts.length ? [] : posts.map((p) => p.id),
    );
  };

  const clearSelectedPosts = () => setSelectedIds([]);

  // IntersectionObserver: sentinel 노출 시 다음 페이지 로딩
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isError && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-gray-500">게시글을 불러오는 데 실패했습니다.</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <DeleteButton ids={selectedIds} clearSelectPost={clearSelectedPosts} />
      </div>
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-200 text-sm text-gray-500 whitespace-nowrap">
            <th className="py-3 px-2 w-10 text-center">
              <input
                type="checkbox"
                checked={posts.length > 0 && selectedIds.length === posts.length}
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
            <th className="py-3 px-2 w-16 text-center">좋아요</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <PostSkeletonRows />
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                ids={selectedIds}
                selectPost={selectPost}
              />
            ))
          )}
          {isFetchingNextPage && <PostSkeletonRows />}
        </tbody>
      </table>

      {!isLoading && posts.length === 0 && (
        <p className="text-center text-gray-400 py-10">게시글이 없습니다.</p>
      )}

      {isError && posts.length > 0 && (
        <div className="flex flex-col items-center gap-2 py-4">
          <p className="text-sm text-gray-500">추가 로딩에 실패했습니다.</p>
          <button
            onClick={() => fetchNextPage()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
          >
            다시 시도
          </button>
        </div>
      )}

      {!hasNextPage && posts.length > 0 && (
        <p className="text-center text-gray-400 text-sm py-4">
          모든 게시글을 불러왔습니다.
        </p>
      )}

      {/* IntersectionObserver sentinel */}
      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}
