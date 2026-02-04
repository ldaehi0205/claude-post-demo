import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { JwtPayload } from '@/types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

// Access Token: 60분 만료
export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '60m' });
}

// 기존 함수명 유지 (하위 호환)
export function signToken(payload: JwtPayload): string {
  return signAccessToken(payload);
}

export interface VerifyTokenResult {
  payload: JwtPayload | null;
  expired: boolean;
}

export function verifyToken(token: string): VerifyTokenResult {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return { payload, expired: false };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { payload: null, expired: true };
    }
    return { payload: null, expired: false };
  }
}

export function getTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

// Refresh Token 생성 (랜덤 문자열)
export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

// Idle timeout: 14일, Absolute timeout: 30일
export const REFRESH_TOKEN_IDLE_DAYS = 14;
export const REFRESH_TOKEN_ABSOLUTE_DAYS = 30;

export function getRefreshTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + REFRESH_TOKEN_ABSOLUTE_DAYS);
  return expiry;
}

export function isIdleTimeoutExpired(lastSeenAt: Date): boolean {
  const idleLimit = new Date();
  idleLimit.setDate(idleLimit.getDate() - REFRESH_TOKEN_IDLE_DAYS);
  return lastSeenAt < idleLimit;
}
