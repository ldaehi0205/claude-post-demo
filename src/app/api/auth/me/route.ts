import { NextResponse } from 'next/server';
import { prisma } from '@/data/prisma';
import { verifyToken, getTokenFromHeader } from '@/utils/jwt';
import { errorResponse } from '@/utils/apiError';

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  const token = getTokenFromHeader(authHeader);

  if (!token) {
    return errorResponse(
      request,
      { error: '인증이 필요합니다.', code: 'authorization' },
      401,
    );
  }

  const { payload, expired } = verifyToken(token);

  if (expired) {
    return errorResponse(
      request,
      { error: '토큰이 만료되었습니다.', code: 'expired_token' },
      401,
    );
  }

  if (!payload) {
    return errorResponse(
      request,
      { error: '유효하지 않은 토큰입니다.', code: 'invalid_token' },
      401,
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      userID: true,
      name: true,
      createdAt: true,
    },
  });

  if (!user) {
    return errorResponse(
      request,
      { error: '사용자를 찾을 수 없습니다.', code: 'not_found' },
      404,
    );
  }

  return NextResponse.json(user);
}
