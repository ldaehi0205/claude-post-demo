import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/data/prisma';
import {
  signToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
  REFRESH_TOKEN_ABSOLUTE_DAYS,
} from '@/utils/jwt';
import { RegisterInput } from '@/types/auth';

export async function POST(request: Request) {
  const body: RegisterInput = await request.json();
  const { userID, password, name } = body;

  const existingUser = await prisma.user.findUnique({
    where: { userID },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: '이미 사용 중인 아이디입니다.', code: 'duplicate_user' },
      { status: 400 },
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      userID,
      password: hashedPassword,
      name,
    },
    select: {
      id: true,
      userID: true,
      name: true,
      createdAt: true,
    },
  });

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

  const response = NextResponse.json({ user, accessToken }, { status: 201 });

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
