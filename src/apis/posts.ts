import { api } from './client';
import { Post, CreatePostInput, UpdatePostInput } from '@/types/post';

export const postsApi = {
  getAll: async (): Promise<Post[]> => {
    const { data } = await api.get<Post[]>('http://localhost:3000/api/posts');
    return data;
  },

  getById: async (id: number): Promise<Post> => {
    const { data } = await api.get<Post>(
      `http://localhost:3000/api/posts/${id}`,
    );
    return data;
  },

  create: async (input: CreatePostInput): Promise<Post> => {
    const { data } = await api.post<Post>(
      'http://localhost:3000/api/posts',
      input,
    );
    return data;
  },

  update: async (id: number, input: UpdatePostInput): Promise<Post> => {
    const { data } = await api.put<Post>(
      `http://localhost:3000/api/posts/${id}`,
      input,
    );
    return data;
  },

  delete: async (ids: number[]): Promise<void> => {
    await api.delete('http://localhost:3000/api/posts', { data: { ids } });
  },
};
