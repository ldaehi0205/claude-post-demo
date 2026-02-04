'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentsApi } from '@/apis/comments';
import { CreateCommentInput, UpdateCommentInput } from '@/types/comment';

/** 댓글 쿼리 키 */
const COMMENTS_KEY = (postId: number) => ['posts', postId, 'comments'];

/** 게시글의 댓글 목록 조회 훅 */
export function useComments(postId: number) {
  return useQuery({
    queryKey: COMMENTS_KEY(postId),
    queryFn: () => commentsApi.getByPostId(postId),
    enabled: !!postId,
  });
}

/** 댓글 작성 훅 */
export function useCreateComment(postId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCommentInput) => commentsApi.create(postId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMENTS_KEY(postId) });
    },
  });
}

/** 댓글 수정 훅 */
export function useUpdateComment(postId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      commentId,
      input,
    }: {
      commentId: number;
      input: UpdateCommentInput;
    }) => commentsApi.update(postId, commentId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMENTS_KEY(postId) });
    },
  });
}

/** 댓글 삭제 훅 */
export function useDeleteComment(postId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: number) => commentsApi.delete(postId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMENTS_KEY(postId) });
    },
  });
}
