import { authApi } from '@/apis/auth';
import { api } from '@/apis/client';

jest.mock('@/apis/client', () => ({
  api: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

const mockPost = api.post as jest.Mock;
const mockGet = api.get as jest.Mock;

describe('authApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('POST /auth/register를 호출하고 AuthResponse를 반환해야 한다', async () => {
      const mockResponse = {
        data: {
          user: { id: 1, userID: 'newuser', name: '새유저', createdAt: new Date() },
          accessToken: 'token123',
        },
      };
      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await authApi.register({
        userID: 'newuser',
        password: 'password123',
        name: '새유저',
      });

      expect(mockPost).toHaveBeenCalledWith('/auth/register', {
        userID: 'newuser',
        password: 'password123',
        name: '새유저',
      });
      expect(result.user.userID).toBe('newuser');
      expect(result.accessToken).toBe('token123');
    });
  });

  describe('login', () => {
    it('POST /auth/login을 호출하고 AuthResponse를 반환해야 한다', async () => {
      const mockResponse = {
        data: {
          user: { id: 1, userID: 'testuser', name: '테스트', createdAt: new Date() },
          accessToken: 'token456',
        },
      };
      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await authApi.login({ userID: 'testuser', password: 'pass' });

      expect(mockPost).toHaveBeenCalledWith('/auth/login', {
        userID: 'testuser',
        password: 'pass',
      });
      expect(result.accessToken).toBe('token456');
    });
  });

  describe('me', () => {
    it('GET /auth/me를 호출하고 User를 반환해야 한다', async () => {
      const mockResponse = {
        data: { id: 1, userID: 'testuser', name: '테스트', createdAt: new Date() },
      };
      mockGet.mockResolvedValueOnce(mockResponse);

      const result = await authApi.me();

      expect(mockGet).toHaveBeenCalledWith('/auth/me');
      expect(result.userID).toBe('testuser');
    });
  });
});
