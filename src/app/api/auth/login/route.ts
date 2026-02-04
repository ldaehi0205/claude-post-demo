import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/data/prisma';
import {
  signToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
  REFRESH_TOKEN_ABSOLUTE_DAYS,
} from '@/utils/jwt';
import { LoginInput } from '@/types/auth';

export async function POST(request: Request) {
  const body: LoginInput = await request.json();
  const { userID, password } = body;

  const user = await prisma.user.findUnique({
    where: { userID },
  });

  if (!user) {
    return NextResponse.json(
      { error: '아이디 또는 비밀번호가 올바르지 않습니다.', code: 'invalid_credentials' },
      { status: 401 },
    );
  }

  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    return NextResponse.json(
      { error: '아이디 또는 비밀번호가 올바르지 않습니다.', code: 'invalid_credentials' },
      { status: 401 },
    );
  }

  const accessToken = signToken({ userId: user.id, userID: user.userID });

  // Refresh Token 생성 및 저장
  const refreshToken = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  const response = NextResponse.json({
    user: {
      id: user.id,
      userID: user.userID,
      name: user.name,
      createdAt: user.createdAt,
    },
    accessToken,
  });

  // Refresh Token을 HttpOnly 쿠키로 설정
  response.cookies.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_ABSOLUTE_DAYS * 24 * 60 * 60,
    path: '/',
  });

  return response;
}
