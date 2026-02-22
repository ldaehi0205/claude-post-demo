import jwt from 'jsonwebtoken';
import {
  signAccessToken,
  signToken,
  verifyToken,
  getTokenFromHeader,
  generateRefreshToken,
  getRefreshTokenExpiry,
  isIdleTimeoutExpired,
  REFRESH_TOKEN_IDLE_DAYS,
  REFRESH_TOKEN_ABSOLUTE_DAYS,
} from '@/utils/jwt';
import { JwtPayload } from '@/types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('signAccessToken', () => {
  const payload: JwtPayload = { userId: 1, userID: 'testuser' };

  it('유효한 JWT 토큰을 생성해야 한다', () => {
    const token = signAccessToken(payload);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    expect(decoded.userId).toBe(1);
    expect(decoded.userID).toBe('testuser');
  });

  it('60분 만료 시간이 설정되어야 한다', () => {
    const token = signAccessToken(payload);
    const decoded = jwt.decode(token) as jwt.JwtPayload;

    const expIn = decoded.exp! - decoded.iat!;
    expect(expIn).toBe(60 * 60); // 3600초
  });
});

describe('signToken', () => {
  it('signAccessToken과 동일한 형식의 토큰을 생성해야 한다', () => {
    const payload: JwtPayload = { userId: 1, userID: 'testuser' };
    const token = signToken(payload);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    expect(decoded.userId).toBe(1);
    expect(decoded.userID).toBe('testuser');
  });
});

describe('verifyToken', () => {
  const payload: JwtPayload = { userId: 1, userID: 'testuser' };

  it('유효한 토큰이면 payload를 반환하고 expired는 false여야 한다', () => {
    const token = signAccessToken(payload);
    const result = verifyToken(token);

    expect(result.payload).not.toBeNull();
    expect(result.payload!.userId).toBe(1);
    expect(result.expired).toBe(false);
  });

  it('만료된 토큰이면 payload는 null이고 expired는 true여야 한다', () => {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '0s' });
    const result = verifyToken(token);

    expect(result.payload).toBeNull();
    expect(result.expired).toBe(true);
  });

  it('잘못된 토큰이면 payload는 null이고 expired는 false여야 한다', () => {
    const result = verifyToken('invalid-token');

    expect(result.payload).toBeNull();
    expect(result.expired).toBe(false);
  });

  it('다른 secret으로 서명된 토큰이면 검증 실패해야 한다', () => {
    const token = jwt.sign(payload, 'wrong-secret', { expiresIn: '60m' });
    const result = verifyToken(token);

    expect(result.payload).toBeNull();
    expect(result.expired).toBe(false);
  });
});

describe('getTokenFromHeader', () => {
  it('Bearer 토큰을 올바르게 추출해야 한다', () => {
    const token = getTokenFromHeader('Bearer abc123');
    expect(token).toBe('abc123');
  });

  it('null 헤더면 null을 반환해야 한다', () => {
    expect(getTokenFromHeader(null)).toBeNull();
  });

  it('Bearer로 시작하지 않으면 null을 반환해야 한다', () => {
    expect(getTokenFromHeader('Basic abc123')).toBeNull();
  });

  it('빈 문자열이면 null을 반환해야 한다', () => {
    expect(getTokenFromHeader('')).toBeNull();
  });
});

describe('generateRefreshToken', () => {
  it('128자 hex 문자열을 생성해야 한다', () => {
    const token = generateRefreshToken();
    expect(token).toHaveLength(128); // 64 bytes = 128 hex chars
    expect(token).toMatch(/^[0-9a-f]+$/);
  });

  it('매번 다른 토큰을 생성해야 한다', () => {
    const token1 = generateRefreshToken();
    const token2 = generateRefreshToken();
    expect(token1).not.toBe(token2);
  });
});

describe('Refresh Token 만료 상수', () => {
  it('Idle timeout은 14일이어야 한다', () => {
    expect(REFRESH_TOKEN_IDLE_DAYS).toBe(14);
  });

  it('Absolute timeout은 30일이어야 한다', () => {
    expect(REFRESH_TOKEN_ABSOLUTE_DAYS).toBe(30);
  });
});

describe('getRefreshTokenExpiry', () => {
  it('현재로부터 30일 후를 반환해야 한다', () => {
    const before = new Date();
    const expiry = getRefreshTokenExpiry();
    const after = new Date();

    const expectedMin = new Date(before);
    expectedMin.setDate(expectedMin.getDate() + 30);

    const expectedMax = new Date(after);
    expectedMax.setDate(expectedMax.getDate() + 30);

    expect(expiry.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime() - 1000);
    expect(expiry.getTime()).toBeLessThanOrEqual(expectedMax.getTime() + 1000);
  });
});

describe('isIdleTimeoutExpired', () => {
  it('14일 이상 경과하면 true를 반환해야 한다', () => {
    const lastSeen = new Date();
    lastSeen.setDate(lastSeen.getDate() - 15);

    expect(isIdleTimeoutExpired(lastSeen)).toBe(true);
  });

  it('14일 미만이면 false를 반환해야 한다', () => {
    const lastSeen = new Date();
    lastSeen.setDate(lastSeen.getDate() - 10);

    expect(isIdleTimeoutExpired(lastSeen)).toBe(false);
  });

  it('방금 사용했으면 false를 반환해야 한다', () => {
    expect(isIdleTimeoutExpired(new Date())).toBe(false);
  });
});
