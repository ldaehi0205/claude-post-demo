import { NextResponse } from 'next/server';
import { prisma } from '@/data/prisma';
import { verifyToken, getTokenFromHeader } from '@/utils/jwt';
import { UpdateCommentInput } from '@/types/comment';

interface Params {
  params: { id: string; commentId: string };
}

export async function PUT(request: Request, { params }: Params) {
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

  const comment = await prisma.comment.findUnique({
    where: { id: Number(params.commentId) },
  });

  if (!comment) {
    return NextResponse.json(
      { error: '댓글을 찾을 수 없습니다.', code: 'not_found' },
      { status: 404 },
    );
  }

  if (comment.authorId !== payload.userId) {
    return NextResponse.json(
      { error: '수정 권한이 없습니다.', code: 'forbidden' },
      { status: 403 },
    );
  }

  const body: UpdateCommentInput = await request.json();

  const updatedComment = await prisma.comment.update({
    where: { id: Number(params.commentId) },
    data: { content: body.content },
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

  return NextResponse.json(updatedComment);
}

export async function DELETE(request: Request, { params }: Params) {
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

  const comment = await prisma.comment.findUnique({
    where: { id: Number(params.commentId) },
  });

  if (!comment) {
    return NextResponse.json(
      { error: '댓글을 찾을 수 없습니다.', code: 'not_found' },
      { status: 404 },
    );
  }

  if (comment.authorId !== payload.userId) {
    return NextResponse.json(
      { error: '삭제 권한이 없습니다.', code: 'forbidden' },
      { status: 403 },
    );
  }

  await prisma.comment.delete({
    where: { id: Number(params.commentId) },
  });

  return NextResponse.json({ message: '댓글이 삭제되었습니다.' });
}
