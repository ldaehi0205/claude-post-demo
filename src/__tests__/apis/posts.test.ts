import { postsApi } from '@/apis/posts';
import { api } from '@/apis/client';

jest.mock('@/apis/client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;
const mockPut = api.put as jest.Mock;
const mockDelete = api.delete as jest.Mock;

describe('postsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('GET /posts를 호출하고 게시글 배열을 반환해야 한다', async () => {
      const posts = [
        { id: 1, title: '게시글1', content: '내용1' },
        { id: 2, title: '게시글2', content: '내용2' },
      ];
      mockGet.mockResolvedValueOnce({ data: posts });

      const result = await postsApi.getAll();

      expect(mockGet).toHaveBeenCalledWith('/posts');
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('게시글1');
    });
  });

  describe('getById', () => {
    it('GET /posts/:id를 호출하고 게시글을 반환해야 한다', async () => {
      const post = { id: 1, title: '게시글', content: '내용' };
      mockGet.mockResolvedValueOnce({ data: post });

      const result = await postsApi.getById(1);

      expect(mockGet).toHaveBeenCalledWith('/posts/1');
      expect(result.id).toBe(1);
    });
  });

  describe('create', () => {
    it('POST /posts를 호출하고 생성된 게시글을 반환해야 한다', async () => {
      const newPost = { id: 3, title: '새 게시글', content: '새 내용' };
      mockPost.mockResolvedValueOnce({ data: newPost });

      const result = await postsApi.create({ title: '새 게시글', content: '새 내용' });

      expect(mockPost).toHaveBeenCalledWith('/posts', { title: '새 게시글', content: '새 내용' });
      expect(result.id).toBe(3);
    });
  });

  describe('update', () => {
    it('PUT /posts/:id를 호출하고 수정된 게시글을 반환해야 한다', async () => {
      const updated = { id: 1, title: '수정됨', content: '수정 내용' };
      mockPut.mockResolvedValueOnce({ data: updated });

      const result = await postsApi.update(1, { title: '수정됨' });

      expect(mockPut).toHaveBeenCalledWith('/posts/1', { title: '수정됨' });
      expect(result.title).toBe('수정됨');
    });
  });

  describe('getSummary', () => {
    it('GET /posts/:id/summary를 호출하고 요약을 반환해야 한다', async () => {
      mockGet.mockResolvedValueOnce({ data: { summary: 'AI 요약 내용' } });

      const result = await postsApi.getSummary(1);

      expect(mockGet).toHaveBeenCalledWith('/posts/1/summary');
      expect(result.summary).toBe('AI 요약 내용');
    });

    it('요약이 없으면 null을 반환해야 한다', async () => {
      mockGet.mockResolvedValueOnce({ data: { summary: null } });

      const result = await postsApi.getSummary(1);
      expect(result.summary).toBeNull();
    });
  });

  describe('delete', () => {
    it('DELETE /posts를 ids 배열과 함께 호출해야 한다', async () => {
      mockDelete.mockResolvedValueOnce({});

      await postsApi.delete([1, 2, 3]);

      expect(mockDelete).toHaveBeenCalledWith('/posts', { data: { ids: [1, 2, 3] } });
    });
  });
});
