import { NextResponse } from 'next/server';
import { prisma } from '@/data/prisma';
import { verifyToken, getTokenFromHeader } from '@/utils/jwt';
import { CreateCommentInput } from '@/types/comment';

interface Params {
  params: { id: string };
}

export async function GET(request: Request, { params }: Params) {
  const comments = await prisma.comment.findMany({
    where: { postId: Number(params.id) },
    orderBy: { createdAt: 'asc' },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          userID: true,
        },
      },
    },
  });

  return NextResponse.json(comments);
}

export async function POST(request: Request, { params }: Params) {
  const authHeader = request.headers.get('Authorization');
  const token = getTokenFromHeader(authHeader);

  if (!token) {
    return NextResponse.json(
      { error: '인증이 필요합니다.', code: 'authorization' },
      { status: 401 },
    );
  }

  const { payload, expired } = verifyToken(token);

  if (expired) {
    return NextResponse.json(
      { error: '토큰이 만료되었습니다.', code: 'expired_token' },
      { status: 401 },
    );
  }

  if (!payload) {
    return NextResponse.json(
      { error: '유효하지 않은 토큰입니다.', code: 'invalid_token' },
      { status: 401 },
    );
  }

  const post = await prisma.post.findUnique({
    where: { id: Number(params.id) },
  });

  if (!post) {
    return NextResponse.json(
      { error: '게시글을 찾을 수 없습니다.', code: 'not_found' },
      { status: 404 },
    );
  }

  const body: CreateCommentInput = await request.json();

  const comment = await prisma.comment.create({
    data: {
      content: body.content,
      postId: Number(params.id),
      authorId: payload.userId,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          userID: true,
        },
      },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
