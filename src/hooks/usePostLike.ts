'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postsApi } from '@/apis/posts';
import { Post, LikeMutationContext } from '@/types/post';

export function usePostLike(postId: number) {
  const queryClient = useQueryClient();
  const queryKey = ['posts', postId];

  return useMutation<
    { likeCount: number; isLiked: boolean },
    Error,
    { isLiked: boolean; likeCount: number },
    LikeMutationContext
  >({
    mutationFn: () => postsApi.toggleLike(postId),

    onMutate: async ({ isLiked, likeCount }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousIsLiked = isLiked;
      const previousLikeCount = likeCount;

      queryClient.setQueryData<Partial<Post>>(queryKey, (old) => ({
        ...old,
        isLiked: !isLiked,
        likeCount: isLiked ? likeCount - 1 : likeCount + 1,
      }));

      return { previousIsLiked, previousLikeCount };
    },

    onError: (_err, _vars, context) => {
      if (!context) return;
      queryClient.setQueryData<Partial<Post>>(queryKey, (old) => ({
        ...old,
        isLiked: context.previousIsLiked,
        likeCount: context.previousLikeCount,
      }));
    },

    onSuccess: (data) => {
      queryClient.setQueryData<Partial<Post>>(queryKey, (old) => ({
        ...old,
        isLiked: data.isLiked,
        likeCount: data.likeCount,
      }));
    },
  });
}
