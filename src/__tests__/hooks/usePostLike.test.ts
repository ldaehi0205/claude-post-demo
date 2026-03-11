import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { usePostLike } from '@/hooks/usePostLike';
import { postsApi } from '@/apis/posts';
import { Post } from '@/types/post';

jest.mock('@/apis/posts', () => ({
  postsApi: {
    toggleLike: jest.fn(),
  },
}));

const mockToggleLike = postsApi.toggleLike as jest.Mock;

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

const basePost: Partial<Post> = {
  id: 1,
  title: '테스트 게시글',
  likeCount: 3,
  isLiked: false,
};

describe('usePostLike', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    jest.clearAllMocks();
  });

  it('낙관적 업데이트로 좋아요 추가 시 캐시가 즉시 업데이트되어야 한다', async () => {
    queryClient.setQueryData(['posts', 1], basePost);
    mockToggleLike.mockResolvedValue({ likeCount: 4, isLiked: true });

    const { result } = renderHook(
      () => usePostLike(1),
      { wrapper: createWrapper(queryClient) }
    );

    await act(async () => {
      result.current.mutate({ isLiked: false, likeCount: 3 });
    });

    const cached = queryClient.getQueryData<Partial<Post>>(['posts', 1]);
    expect(cached?.likeCount).toBe(4);
    expect(cached?.isLiked).toBe(true);
  });

  it('API 호출 실패 시 캐시가 이전 값으로 롤백되어야 한다', async () => {
    queryClient.setQueryData(['posts', 1], basePost);
    mockToggleLike.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(
      () => usePostLike(1),
      { wrapper: createWrapper(queryClient) }
    );

    await act(async () => {
      result.current.mutate({ isLiked: false, likeCount: 3 });
    });

    const cached = queryClient.getQueryData<Partial<Post>>(['posts', 1]);
    expect(cached?.likeCount).toBe(3);
    expect(cached?.isLiked).toBe(false);
  });
});
