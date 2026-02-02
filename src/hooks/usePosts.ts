'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsApi } from '@/apis/posts';
import { CreatePostInput, UpdatePostInput } from '@/types/post';

/** 게시글 관련 쿼리 키 */
const POSTS_KEY = ['posts'];

/** 게시글 목록 조회 훅*/
export function usePosts() {
  return useQuery({
    queryKey: POSTS_KEY,
    queryFn: postsApi.getAll,
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
