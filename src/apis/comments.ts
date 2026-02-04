import { api } from './client';
import { Comment, CreateCommentInput, UpdateCommentInput } from '@/types/comment';

export const commentsApi = {
  getByPostId: async (postId: number): Promise<Comment[]> => {
    const { data } = await api.get<Comment[]>(
      `http://localhost:3000/api/posts/${postId}/comments`,
    );
    return data;
  },

  create: async (postId: number, input: CreateCommentInput): Promise<Comment> => {
    const { data } = await api.post<Comment>(
      `http://localhost:3000/api/posts/${postId}/comments`,
      input,
    );
    return data;
  },

  update: async (
    postId: number,
    commentId: number,
    input: UpdateCommentInput,
  ): Promise<Comment> => {
    const { data } = await api.put<Comment>(
      `http://localhost:3000/api/posts/${postId}/comments/${commentId}`,
      input,
    );
    return data;
  },

  delete: async (postId: number, commentId: number): Promise<void> => {
    await api.delete(
      `http://localhost:3000/api/posts/${postId}/comments/${commentId}`,
    );
  },
};
