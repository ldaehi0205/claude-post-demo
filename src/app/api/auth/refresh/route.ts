import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/data/prisma';
import {
  signToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
  isIdleTimeoutExpired,
  REFRESH_TOKEN_ABSOLUTE_DAYS,
} from '@/utils/jwt';

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refreshToken')?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { error: 'Refresh Token이 없습니다.', code: 'authorization' },
      { status: 401 },
    );
  }

  // DB에서 Refresh Token 조회
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!storedToken) {
    return NextResponse.json(
      { error: '유효하지 않은 Refresh Token입니다.', code: 'invalid_token' },
      { status: 401 },
    );
  }

  // Revoked 체크
  if (storedToken.revoked) {
    return NextResponse.json(
      { error: '유효하지 않은 Refresh Token입니다.', code: 'invalid_token' },
      { status: 401 },
    );
  }

  // Absolute timeout (30일) 체크
  if (storedToken.expiresAt < new Date()) {
    return NextResponse.json(
      { error: 'Refresh Token이 만료되었습니다.', code: 'expired_token' },
      { status: 401 },
    );
  }

  // Idle timeout (14일) 체크
  if (isIdleTimeoutExpired(storedToken.lastSeenAt)) {
    return NextResponse.json(
      { error: 'Refresh Token이 만료되었습니다.', code: 'expired_token' },
      { status: 401 },
    );
  }

  const user = storedToken.user;

  // 새 Access Token 발급
  const accessToken = signToken({ userId: user.id, userID: user.userID });

  // Refresh Token Rotation: 기존 토큰 revoke 및 새 토큰 발급
  const newRefreshToken = generateRefreshToken();

  await prisma.$transaction([
    // 기존 토큰 revoke
    prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    }),
    // 새 토큰 생성
    prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt: getRefreshTokenExpiry(),
      },
    }),
  ]);

  const response = NextResponse.json({ accessToken });

  // 새 Refresh Token을 HttpOnly 쿠키로 설정
  response.cookies.set('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_ABSOLUTE_DAYS * 24 * 60 * 60,
    path: '/',
  });

  return response;
}
