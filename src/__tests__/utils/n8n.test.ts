import { notifyNewPost, requestAISummary } from '@/utils/n8n';

// global.fetch를 mock
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('notifyNewPost', () => {
  const originalEnv = process.env;

  const payload = {
    id: 1,
    title: '테스트 게시글',
    authorName: '홍길동',
    authorId: 'user1',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    url: 'http://localhost:3000/posts/1',
  };

  beforeEach(() => {
    jest.resetModules();
    mockFetch.mockReset();
    process.env = { ...originalEnv };
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterAll(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('N8N_WEBHOOK_URL이 없으면 fetch를 호출하지 않아야 한다', async () => {
    delete process.env.N8N_WEBHOOK_URL;
    await notifyNewPost(payload);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('N8N_WEBHOOK_URL이 있으면 올바른 payload로 fetch를 호출해야 한다', async () => {
    process.env.N8N_WEBHOOK_URL = 'https://n8n.example.com/webhook';
    mockFetch.mockResolvedValueOnce({ ok: true });

    await notifyNewPost(payload);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://n8n.example.com/webhook',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.event).toBe('new_post');
    expect(body.post.id).toBe(1);
    expect(body.post.title).toBe('테스트 게시글');
    expect(body.post.author).toBe('홍길동');
  });

  it('fetch 실패 시 에러를 throw하지 않아야 한다', async () => {
    process.env.N8N_WEBHOOK_URL = 'https://n8n.example.com/webhook';
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(notifyNewPost(payload)).resolves.toBeUndefined();
  });

  it('응답이 ok가 아니어도 에러를 throw하지 않아야 한다', async () => {
    process.env.N8N_WEBHOOK_URL = 'https://n8n.example.com/webhook';
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Internal Server Error' });

    await expect(notifyNewPost(payload)).resolves.toBeUndefined();
  });
});

describe('requestAISummary', () => {
  const originalEnv = process.env;

  const payload = {
    id: 1,
    title: '테스트 게시글',
    content: '게시글 본문 내용입니다.',
    callbackUrl: 'http://localhost:3000/api/posts/1/summary',
  };

  beforeEach(() => {
    jest.resetModules();
    mockFetch.mockReset();
    process.env = { ...originalEnv };
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterAll(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('N8N_SUMMARY_WEBHOOK_URL이 없으면 fetch를 호출하지 않아야 한다', async () => {
    delete process.env.N8N_SUMMARY_WEBHOOK_URL;
    await requestAISummary(payload);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('N8N_SUMMARY_WEBHOOK_URL이 있으면 올바른 payload로 fetch를 호출해야 한다', async () => {
    process.env.N8N_SUMMARY_WEBHOOK_URL = 'https://n8n.example.com/summary';
    mockFetch.mockResolvedValueOnce({ ok: true });

    await requestAISummary(payload);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.event).toBe('summarize_post');
    expect(body.post.id).toBe(1);
    expect(body.post.content).toBe('게시글 본문 내용입니다.');
    expect(body.post.callbackUrl).toBe('http://localhost:3000/api/posts/1/summary');
  });

  it('fetch 실패 시 에러를 throw하지 않아야 한다', async () => {
    process.env.N8N_SUMMARY_WEBHOOK_URL = 'https://n8n.example.com/summary';
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(requestAISummary(payload)).resolves.toBeUndefined();
  });
});
