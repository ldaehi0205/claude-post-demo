'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { postsApi } from '@/apis/posts';
import { CreatePostInput, UpdatePostInput, PaginatedPostsResponse } from '@/types/post';

/** 게시글 관련 쿼리 키 */
const POSTS_KEY = ['posts'];

/** 게시글 목록 조회 훅*/
export function usePosts() {
  return useQuery({
    queryKey: POSTS_KEY,
    queryFn: () => postsApi.getAll(),
  });
}

/** 게시글 상세 조회 훅*/
export function usePost(id: number) {
  return useQuery({
    queryKey: [...POSTS_KEY, id],
    queryFn: () => postsApi.getById(id),
    enabled: !!id,
  });
}

/** 게시글 요약 조회 훅 (summary가 없으면 5초마다 폴링) */
export function usePostSummary(id: number) {
  return useQuery({
    queryKey: [...POSTS_KEY, id, 'summary'],
    queryFn: () => postsApi.getSummary(id),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data && !data.summary ? 5000 : false;
    },
  });
}

/*** 게시글 작성 훅*/
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePostInput) => postsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POSTS_KEY });
    },
  });
}

/** 게시글 수정 훅*/
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdatePostInput }) =>
      postsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POSTS_KEY });
    },
  });
}

/** 게시글 무한스크롤 목록 훅 */
export function useInfinitePosts(tag?: string) {
  return useInfiniteQuery<PaginatedPostsResponse>({
    queryKey: [...POSTS_KEY, 'infinite', tag],
    queryFn: ({ pageParam }) =>
      postsApi.getPaginated({ page: pageParam as number, limit: 20, tag }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.page + 1 : undefined,
  });
}

/*** 게시글 삭제 훅*/
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: number[]) => postsApi.delete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POSTS_KEY });
    },
  });
}
