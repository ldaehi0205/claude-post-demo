import { tagsApi } from '@/apis/tags';
import { api } from '@/apis/client';

jest.mock('@/apis/client', () => ({
  api: {
    get: jest.fn(),
  },
}));

const mockGet = api.get as jest.Mock;

describe('tagsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('GET /tags를 호출하고 태그 목록을 반환해야 한다', async () => {
      const tags = [
        { name: 'react', postCount: 5 },
        { name: 'nextjs', postCount: 3 },
      ];
      mockGet.mockResolvedValueOnce({ data: { tags } });

      const result = await tagsApi.getAll();

      expect(mockGet).toHaveBeenCalledWith('/tags');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('react');
      expect(result[0].postCount).toBe(5);
    });

    it('태그가 없으면 빈 배열을 반환해야 한다', async () => {
      mockGet.mockResolvedValueOnce({ data: { tags: [] } });

      const result = await tagsApi.getAll();

      expect(result).toEqual([]);
    });
  });
});
