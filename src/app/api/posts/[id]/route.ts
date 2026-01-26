import { NextResponse } from 'next/server';
import { prisma } from '@/data/prisma';
import { verifyToken, getTokenFromHeader } from '@/utils/jwt';
import { UpdatePostInput } from '@/types/post';

interface Params {
  params: { id: string };
}

export async function GET(request: Request, { params }: Params) {
  const post = await prisma.post.findUnique({
    where: { id: Number(params.id) },
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

  if (!post) {
    return NextResponse.json(
      { error: '게시글을 찾을 수 없습니다.' },
      { status: 404 },
    );
  }

  return NextResponse.json(post);
}

export async function PUT(request: Request, { params }: Params) {
  const authHeader = request.headers.get('Authorization');
  const token = getTokenFromHeader(authHeader);

  if (!token) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const payload = verifyToken(token);

  if (!payload) {
    return NextResponse.json(
      { error: '유효하지 않은 토큰입니다.' },
      { status: 401 },
    );
  }

  const post = await prisma.post.findUnique({
    where: { id: Number(params.id) },
  });

  if (!post) {
    return NextResponse.json(
      { error: '게시글을 찾을 수 없습니다.' },
      { status: 404 },
    );
  }

  if (post.authorId !== payload.userId) {
    return NextResponse.json(
      { error: '수정 권한이 없습니다.' },
      { status: 403 },
    );
  }

  const body: UpdatePostInput = await request.json();
  const updatedPost = await prisma.post.update({
    where: { id: Number(params.id) },
    data: body,
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

  return NextResponse.json(updatedPost);
}

export async function DELETE(request: Request, { params }: Params) {
  const authHeader = request.headers.get('Authorization');
  const token = getTokenFromHeader(authHeader);

  if (!token) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const payload = verifyToken(token);

  if (!payload) {
    return NextResponse.json(
      { error: '유효하지 않은 토큰입니다.' },
      { status: 401 },
    );
  }

  const post = await prisma.post.findUnique({
    where: { id: Number(params.id) },
  });

  if (!post) {
    return NextResponse.json(
      { error: '게시글을 찾을 수 없습니다.' },
      { status: 404 },
    );
  }

  if (post.authorId !== payload.userId) {
    return NextResponse.json(
      { error: '삭제 권한이 없습니다.' },
      { status: 403 },
    );
  }

  await prisma.post.delete({
    where: { id: Number(params.id) },
  });

  return NextResponse.json({ message: '게시글이 삭제되었습니다.' });
}
