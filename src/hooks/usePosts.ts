'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { postsApi } from '@/apis/posts'
import { CreatePostInput, UpdatePostInput } from '@/types/post'

const POSTS_KEY = ['posts']

export function usePosts() {
  return useQuery({
    queryKey: POSTS_KEY,
    queryFn: postsApi.getAll,
  })
}

export function usePost(id: number) {
  return useQuery({
    queryKey: [...POSTS_KEY, id],
    queryFn: () => postsApi.getById(id),
    enabled: !!id,
  })
}

export function useCreatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreatePostInput) => postsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POSTS_KEY })
    },
  })
}

export function useUpdatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdatePostInput }) =>
      postsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POSTS_KEY })
    },
  })
}

export function useDeletePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => postsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POSTS_KEY })
    },
  })
}
