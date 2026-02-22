import { getBaseUrl } from '@/utils/url';

describe('getBaseUrl', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.VERCEL_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('NEXT_PUBLIC_BASE_URL이 설정되면 해당 값을 반환해야 한다', () => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://my-app.com';
    expect(getBaseUrl()).toBe('https://my-app.com');
  });

  it('VERCEL_URL이 설정되면 https 프로토콜을 붙여 반환해야 한다', () => {
    process.env.VERCEL_URL = 'my-app.vercel.app';
    expect(getBaseUrl()).toBe('https://my-app.vercel.app');
  });

  it('NEXT_PUBLIC_BASE_URL이 VERCEL_URL보다 우선해야 한다', () => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://custom.com';
    process.env.VERCEL_URL = 'my-app.vercel.app';
    expect(getBaseUrl()).toBe('https://custom.com');
  });

  it('환경변수가 없으면 localhost:3000을 반환해야 한다', () => {
    expect(getBaseUrl()).toBe('http://localhost:3000');
  });
});
