import { commentsApi } from '@/apis/comments';
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

describe('commentsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getByPostId', () => {
    it('GET /posts/:postId/comments를 호출하고 댓글 배열을 반환해야 한다', async () => {
      const comments = [
        { id: 1, content: '댓글1', postId: 1 },
        { id: 2, content: '댓글2', postId: 1 },
      ];
      mockGet.mockResolvedValueOnce({ data: comments });

      const result = await commentsApi.getByPostId(1);

      expect(mockGet).toHaveBeenCalledWith('/posts/1/comments');
      expect(result).toHaveLength(2);
    });
  });

  describe('create', () => {
    it('POST /posts/:postId/comments를 호출하고 생성된 댓글을 반환해야 한다', async () => {
      const newComment = { id: 3, content: '새 댓글', postId: 1 };
      mockPost.mockResolvedValueOnce({ data: newComment });

      const result = await commentsApi.create(1, { content: '새 댓글' });

      expect(mockPost).toHaveBeenCalledWith('/posts/1/comments', { content: '새 댓글' });
      expect(result.content).toBe('새 댓글');
    });
  });

  describe('update', () => {
    it('PUT /posts/:postId/comments/:commentId를 호출하고 수정된 댓글을 반환해야 한다', async () => {
      const updated = { id: 1, content: '수정된 댓글', postId: 1 };
      mockPut.mockResolvedValueOnce({ data: updated });

      const result = await commentsApi.update(1, 1, { content: '수정된 댓글' });

      expect(mockPut).toHaveBeenCalledWith('/posts/1/comments/1', { content: '수정된 댓글' });
      expect(result.content).toBe('수정된 댓글');
    });
  });

  describe('delete', () => {
    it('DELETE /posts/:postId/comments/:commentId를 호출해야 한다', async () => {
      mockDelete.mockResolvedValueOnce({});

      await commentsApi.delete(1, 5);

      expect(mockDelete).toHaveBeenCalledWith('/posts/1/comments/5');
    });
  });
});
