import axios from 'axios';
import { Post, CreatePostInput, UpdatePostInput } from '@/types/post';

const api = axios.create({
  baseURL: '/api',
});

export const postsApi = {
  getAll: async (): Promise<Post[]> => {
    const { data } = await api.get<Post[]>('/posts');
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

  delete: async (id: number): Promise<void> => {
    await api.delete(`/posts/${id}`);
  },
};
