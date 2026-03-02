import { api } from './client';
import { Post, CreatePostInput, UpdatePostInput, PaginatedPostsResponse } from '@/types/post';

export const postsApi = {
  getAll: async (tag?: string): Promise<Post[]> => {
    const params = tag ? `?tag=${encodeURIComponent(tag)}` : '';
    const { data } = await api.get<Post[]>(`/posts${params}`);
    return data;
  },

  getPaginated: async (params: { page: number; limit?: number; tag?: string }): Promise<PaginatedPostsResponse> => {
    const { page, limit = 20, tag } = params;
    const searchParams = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (tag) searchParams.set('tag', tag);
    const { data } = await api.get<PaginatedPostsResponse>(`/posts?${searchParams}`);
    return data;
  },

  getById: async (id: number): Promise<Post> => {
    const { data } = await api.get<Post>(`/posts/${id}`);
    return data;
  },

  create: async (input: CreatePostInput): Promise<Post> => {
    const { data } = await api.post<Post>('/posts', input);
    return data;
  },

  update: async (id: number, input: UpdatePostInput): Promise<Post> => {
    const { data } = await api.put<Post>(`/posts/${id}`, input);
    return data;
  },

  getSummary: async (id: number): Promise<{ summary: string | null }> => {
    const { data } = await api.get<{ summary: string | null }>(
      `/posts/${id}/summary`,
    );
    return data;
  },

  delete: async (ids: number[]): Promise<void> => {
    await api.delete('/posts', { data: { ids } });
  },
};
