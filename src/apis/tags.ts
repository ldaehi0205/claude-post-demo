import { api } from './client';
import { TagWithCount } from '@/types/tag';

export const tagsApi = {
  getAll: async (): Promise<TagWithCount[]> => {
    const { data } = await api.get<{ tags: TagWithCount[] }>('/tags');
    return data.tags;
  },
};
