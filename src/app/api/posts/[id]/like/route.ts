import { NextResponse } from 'next/server';
import { prisma } from '@/data/prisma';
import { verifyToken, getTokenFromHeader } from '@/utils/jwt';
import { errorResponse } from '@/utils/apiError';

interface Params {
  params: { id: string };
}

export async function POST(request: Request, { params }: Params) {
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

  const postId = Number(params.id);
  const userId = payload.userId;

  const post = await prisma.post.findUnique({ where: { id: postId } });

  if (!post) {
    return errorResponse(
      request,
      { error: '게시글을 찾을 수 없습니다.', code: 'not_found' },
      404,
    );
  }

  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  if (existing) {
    await prisma.postLike.delete({
      where: { postId_userId: { postId, userId } },
    });
  } else {
    await prisma.postLike.create({ data: { postId, userId } });
  }

  const likeCount = await prisma.postLike.count({ where: { postId } });

  return NextResponse.json({ likeCount, isLiked: !existing });
}
