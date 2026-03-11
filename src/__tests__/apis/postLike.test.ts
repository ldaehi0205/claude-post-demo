import { postsApi } from '@/apis/posts';
import { api } from '@/apis/client';

jest.mock('@/apis/client', () => ({
  api: {
    post: jest.fn(),
  },
}));

const mockPost = api.post as jest.Mock;

describe('postsApi.toggleLike', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /posts/1/like를 호출하고 isLiked: true를 반환해야 한다', async () => {
    mockPost.mockResolvedValueOnce({ data: { likeCount: 1, isLiked: true } });

    const result = await postsApi.toggleLike(1);

    expect(mockPost).toHaveBeenCalledWith('/posts/1/like');
    expect(result.isLiked).toBe(true);
    expect(result.likeCount).toBe(1);
  });

  it('좋아요 취소 시 isLiked: false를 반환해야 한다', async () => {
    mockPost.mockResolvedValueOnce({ data: { likeCount: 0, isLiked: false } });

    const result = await postsApi.toggleLike(1);

    expect(mockPost).toHaveBeenCalledWith('/posts/1/like');
    expect(result.isLiked).toBe(false);
    expect(result.likeCount).toBe(0);
  });
});
