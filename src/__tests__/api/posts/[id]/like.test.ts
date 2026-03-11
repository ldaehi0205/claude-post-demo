import { POST } from '@/app/api/posts/[id]/like/route';

jest.mock('@/data/prisma', () => ({
  prisma: {
    post: { findUnique: jest.fn() },
    postLike: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('@/utils/jwt', () => ({
  getTokenFromHeader: jest.fn(),
  verifyToken: jest.fn(),
}));

jest.mock('@/utils/apiError', () => ({
  errorResponse: jest.fn((_, body, status) =>
    new Response(JSON.stringify(body), { status })
  ),
}));

import { prisma } from '@/data/prisma';
import { getTokenFromHeader, verifyToken } from '@/utils/jwt';

const mockFindPost = prisma.post.findUnique as jest.Mock;
const mockFindLike = prisma.postLike.findUnique as jest.Mock;
const mockCreateLike = prisma.postLike.create as jest.Mock;
const mockDeleteLike = prisma.postLike.delete as jest.Mock;
const mockCountLike = prisma.postLike.count as jest.Mock;
const mockGetToken = getTokenFromHeader as jest.Mock;
const mockVerify = verifyToken as jest.Mock;

function makeRequest(authHeader?: string) {
  return new Request('http://localhost/api/posts/1/like', {
    method: 'POST',
    headers: authHeader ? { Authorization: authHeader } : {},
  });
}

const params = { params: { id: '1' } };

describe('POST /api/posts/[id]/like', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Authorization 헤더가 없으면 401을 반환해야 한다', async () => {
    mockGetToken.mockReturnValue(null);

    const res = await POST(makeRequest(), params);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.code).toBe('authorization');
  });

  it('만료된 토큰이면 401 expired_token을 반환해야 한다', async () => {
    mockGetToken.mockReturnValue('expired.token');
    mockVerify.mockReturnValue({ payload: null, expired: true });

    const res = await POST(makeRequest('Bearer expired.token'), params);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.code).toBe('expired_token');
  });

  it('존재하지 않는 게시글이면 404를 반환해야 한다', async () => {
    mockGetToken.mockReturnValue('valid.token');
    mockVerify.mockReturnValue({ payload: { userId: 1 }, expired: false });
    mockFindPost.mockResolvedValue(null);

    const res = await POST(makeRequest('Bearer valid.token'), params);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.code).toBe('not_found');
  });

  it('좋아요가 없으면 추가하고 isLiked: true를 반환해야 한다', async () => {
    mockGetToken.mockReturnValue('valid.token');
    mockVerify.mockReturnValue({ payload: { userId: 1 }, expired: false });
    mockFindPost.mockResolvedValue({ id: 1 });
    mockFindLike.mockResolvedValue(null);
    mockCreateLike.mockResolvedValue({});
    mockCountLike.mockResolvedValue(1);

    const res = await POST(makeRequest('Bearer valid.token'), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.isLiked).toBe(true);
    expect(body.likeCount).toBe(1);
    expect(mockCreateLike).toHaveBeenCalledWith({
      data: { postId: 1, userId: 1 },
    });
  });

  it('이미 좋아요가 있으면 삭제하고 isLiked: false를 반환해야 한다', async () => {
    mockGetToken.mockReturnValue('valid.token');
    mockVerify.mockReturnValue({ payload: { userId: 1 }, expired: false });
    mockFindPost.mockResolvedValue({ id: 1 });
    mockFindLike.mockResolvedValue({ postId: 1, userId: 1 });
    mockDeleteLike.mockResolvedValue({});
    mockCountLike.mockResolvedValue(0);

    const res = await POST(makeRequest('Bearer valid.token'), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.isLiked).toBe(false);
    expect(body.likeCount).toBe(0);
    expect(mockDeleteLike).toHaveBeenCalledWith({
      where: { postId_userId: { postId: 1, userId: 1 } },
    });
  });
});
